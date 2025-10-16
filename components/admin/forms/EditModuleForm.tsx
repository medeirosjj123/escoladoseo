import React, { useState, useEffect } from 'react';
import { supabase } from '../../../src/supabaseClient';
import FileUpload from '../FileUpload';

interface EditModuleFormProps {
    moduleId: number;
    onModuleUpdated: () => void;
    onCancel: () => void;
}

const EditModuleForm: React.FC<EditModuleFormProps> = ({ moduleId, onModuleUpdated, onCancel }) => {
    const [title, setTitle] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchModule = async () => {
            setFormLoading(true);
            const { data, error } = await supabase
                .from('modules')
                .select('title, thumbnail_url')
                .eq('id', moduleId)
                .single();
            
            if (error) {
                setError('Failed to fetch module data.');
            } else if (data) {
                setTitle(data.title);
                setThumbnailUrl(data.thumbnail_url);
            }
            setFormLoading(false);
        };
        fetchModule();
    }, [moduleId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase
            .from('modules')
            .update({ title, thumbnail_url: thumbnailUrl })
            .eq('id', moduleId);

        setLoading(false);
        if (updateError) {
            setError(updateError.message);
        } else {
            onModuleUpdated();
        }
    };

    if (formLoading) {
        return <p>Carregando editor de módulo...</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-lg font-semibold">Editar Módulo</h4>
            <div>
                <label htmlFor="moduleTitle" className="block text-sm font-medium text-gray-300 mb-2">Título do Módulo</label>
                <input
                    id="moduleTitle"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black/20 border border-white/20 rounded-md py-2 px-4"
                    required
                />
            </div>
            <FileUpload 
                label="Nova Thumbnail (opcional)"
                bucketName="course_assets"
                onUpload={(url) => setThumbnailUrl(url)}
            />
            {thumbnailUrl && <img src={thumbnailUrl} alt="Thumbnail preview" className="w-40 h-auto rounded-md" />}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end space-x-4 pt-2">
                <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">
                    Cancelar
                </button>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    );
};

export default EditModuleForm;
