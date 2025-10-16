import React, { useState } from 'react';
import { supabase } from '../../src/supabaseClient';

interface FileUploadProps {
    bucketName: string;
    onUpload: (filePath: string) => void;
    label: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ bucketName, onUpload, label }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setError(null);
            setFileName(null);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const newFileName = `${Date.now()}.${fileExt}`;
            const filePath = `${newFileName}`;

            let { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // We call onUpload with the public URL
            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            onUpload(data.publicUrl);
            setFileName(file.name);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
            <div className="flex items-center">
                <label htmlFor="file-upload" className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                </label>
                <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={uploading}
                    accept="image/*"
                />
                {fileName && <span className="ml-4 text-gray-400">{fileName}</span>}
            </div>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default FileUpload;
