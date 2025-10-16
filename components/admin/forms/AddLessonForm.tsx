import React, { useState } from 'react';
import { supabase } from '../../../src/supabaseClient';

interface AddLessonFormProps {
    moduleId: number;
    onLessonAdded: () => void;
    onCancel: () => void;
}

const AddLessonForm: React.FC<AddLessonFormProps> = ({ moduleId, onLessonAdded, onCancel }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [releaseDays, setReleaseDays] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data: lessons, error: orderError } = await supabase
            .from('lessons').select('order').eq('module_id', moduleId).order('order', { ascending: false }).limit(1);

        if (orderError) {
            setError(orderError.message);
            setLoading(false);
            return;
        }

        const newOrder = (lessons && lessons.length > 0) ? lessons[0].order + 1 : 1;

        const { error: insertError } = await supabase
            .from('lessons')
            .insert([{
                module_id: moduleId,
                title,
                description,
                video_url: videoUrl,
                release_days: releaseDays,
                order: newOrder
            }]);

        setLoading(false);
        if (insertError) {
            setError(insertError.message);
        } else {
            onLessonAdded();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-lg font-semibold">Adicionar Nova Aula</h4>
            <div>
                <label htmlFor="lessonTitle" className="block text-sm font-medium text-gray-300 mb-2">Título da Aula</label>
                <input id="lessonTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black/20 border border-white/20 rounded-md py-2 px-4" required />
            </div>
            <div>
                <label htmlFor="lessonDesc" className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea id="lessonDesc" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-black/20 border border-white/20 rounded-md py-2 px-4" rows={3}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="lessonVideo" className="block text-sm font-medium text-gray-300 mb-2">URL do Vídeo</label>
                    <input id="lessonVideo" type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full bg-black/20 border border-white/20 rounded-md py-2 px-4" required />
                </div>
                <div>
                    <label htmlFor="lessonDays" className="block text-sm font-medium text-gray-300 mb-2">Dias para Liberar</label>
                    <input id="lessonDays" type="number" value={releaseDays} onChange={(e) => setReleaseDays(parseInt(e.target.value))} className="w-full bg-black/20 border border-white/20 rounded-md py-2 px-4" required />
                </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end space-x-4 pt-2">
                <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">Cancelar</button>
                <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">
                    {loading ? 'Adicionando...' : 'Adicionar Aula'}
                </button>
            </div>
        </form>
    );
};

export default AddLessonForm;
