import React, { useState } from 'react';
import api from '../../api/axios';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
    onUploadSuccess: (path: string) => void;
    currentImage?: string;
}

export default function IconUploader({ onUploadSuccess, currentImage }: Props) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Visual Preview
        setPreview(URL.createObjectURL(file));
        
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/admin/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Pass the relative path back to the parent (Services.tsx)
            onUploadSuccess(res.data.path);
        } catch (err) {
            alert("Upload failed. Check server permissions.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                    <Upload className="text-slate-300" />
                )}
            </div>
            
            <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-1">Service Icon</label>
                <input 
                    type="file" 
                    onChange={handleUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
            </div>

            {uploading && <Loader2 className="animate-spin text-blue-600" />}
            {!uploading && preview && <CheckCircle className="text-green-500" />}
        </div>
    );
}