import React, { useState } from 'react';
import { supabase } from '../../../src/supabaseClient';
import FileUpload from '../FileUpload';

interface AddModuleFormProps {
    courseId: number;
    onModuleAdded: () => void;
}

const AddModuleForm: React.FC<AddModuleFormProps> = ({ courseId, onModuleAdded }) => {
    const [title, setTitle] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Get the highest current order to place the new one at the end
        const { data: modules, error: orderError } = await supabase
            .from('modules').select('order').eq('course_id', courseId).order('order', { ascending: false }).limit(1);

        if (orderError) {
            setError(orderError.message);
            setLoading(false);
            return;
        }

        const newOrder = (modules && modules.length > 0) ? modules[0].order + 1 : 1;

        const { error: insertError } = await supabase
            .from('modules')
            .insert([{
                course_id: courseId,
                title,
                thumbnail_url: thumbnailUrl,
                order: newOrder
            }]);

        setLoading(false);
        if (insertError) {
            setError(insertError.message);
        } else {
            onModuleAdded(); // This will trigger a refresh and close the form
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-lg font-semibold">Adicionar Novo Módulo</h4>
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
                label="Thumbnail do Módulo"
                bucketName="course_assets"
                onUpload={(url) => setThumbnailUrl(url)}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end space-x-4 pt-2">
                 <button type="button" onClick={onModuleAdded} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">
                    Cancelar
                </button>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                    {loading ? 'Adicionando...' : 'Adicionar Módulo'}
                </button>
            </div>
        </form>
    );
};

export default AddModuleForm;
