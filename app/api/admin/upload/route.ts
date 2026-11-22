import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAdminSessionValid } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    // 1. Verifikasi autentikasi sesi admin (HMAC-SHA256)
    const cookieHeader = req.headers.get("cookie") || "";
    const sessionMatch = cookieHeader.match(/dioleh2_admin_session=([^;]+)/);
    const sessionToken = sessionMatch ? sessionMatch[1] : undefined;
    const isAuthorized = await isAdminSessionValid(sessionToken);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya admin dengan sesi valid yang dapat mengunggah gambar" },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // 2A. Penanganan Multipart Form Data (Standar input type="file" dari desktop/mobile)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const targetFolder = (formData.get("folder") as string) || "products"; // "products" | "settings"

      if (!file) {
        return NextResponse.json({ success: false, error: "File gambar tidak ditemukan" }, { status: 400 });
      }

      // Validasi tipe file
      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: `Format file ${file.type} tidak didukung. Gunakan JPG, PNG, atau WebP.` },
          { status: 400 }
        );
      }

      // Validasi ukuran file
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `Ukuran file terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maksimal 5 MB.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Tentukan ekstensi
      const extMatch = file.name.match(/\.(jpg|jpeg|png|webp)$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : file.type.split("/")[1] || "jpg";

      // Buat direktori tujuan
      const cleanFolder = targetFolder.replace(/[^a-zA-Z0-9_-]/g, "");
      const uploadDir = path.join(process.cwd(), "public", "uploads", cleanFolder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Beri nama unik file
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${cleanFolder}_${timestamp}_${randomStr}.${ext}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${cleanFolder}/${fileName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName,
        size: file.size,
        message: "Gambar berhasil diunggah",
      });
    }

    // 2B. Penanganan JSON Base64 (Untuk opsi preview/crop client-side jika ada)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { imageBase64, folder = "products" } = body;

      if (!imageBase64 || typeof imageBase64 !== "string") {
        return NextResponse.json({ success: false, error: "Data base64 tidak valid" }, { status: 400 });
      }

      const matches = imageBase64.match(/^data:image\/(jpeg|png|webp|jpg);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json(
          { success: false, error: "Format base64 tidak didukung. Harus data:image/(jpeg|png|webp);base64,..." },
          { status: 400 }
        );
      }

      const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      const buffer = Buffer.from(matches[2], "base64");

      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: "Ukuran gambar melebihi batas 5 MB" }, { status: 400 });
      }

      const cleanFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, "");
      const uploadDir = path.join(process.cwd(), "public", "uploads", cleanFolder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${cleanFolder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);

      const publicUrl = `/uploads/${cleanFolder}/${fileName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName,
        size: buffer.length,
        message: "Gambar berhasil diunggah",
      });
    }

    return NextResponse.json({ success: false, error: "Content-Type tidak didukung" }, { status: 400 });
  } catch (error: any) {
    console.error("[admin-upload] Error uploading image:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengunggah gambar ke server" },
      { status: 500 }
    );
  }
}
