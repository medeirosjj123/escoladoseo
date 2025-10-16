import React, { useState, useEffect } from 'react';
import { supabase } from '../../../src/supabaseClient';

interface EditLessonFormProps {
    lessonId: number;
    onLessonUpdated: () => void;
    onCancel: () => void;
}

const EditLessonForm: React.FC<EditLessonFormProps> = ({ lessonId, onLessonUpdated, onCancel }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [releaseDays, setReleaseDays] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [transcriptColumnExists, setTranscriptColumnExists] = useState(true);

    useEffect(() => {
        const fetchLesson = async () => {
            setFormLoading(true);
            setError(null);

            // First, try to fetch everything including the transcript
            const { data, error } = await supabase
                .from('lessons')
                .select('title, description, video_url, release_days, transcript')
                .eq('id', lessonId)
                .single();

            if (data) {
                // Success on the first try
                setTitle(data.title);
                setDescription(data.description || '');
                setVideoUrl(data.video_url || '');
                setReleaseDays(data.release_days || 0);
                setTranscript(data.transcript || '');
                setTranscriptColumnExists(true);
            } else if (error && error.message.includes('column "transcript" does not exist')) {
                // If it fails because the column is missing, set the flag and fetch again without it
                setTranscriptColumnExists(false);
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('lessons')
                    .select('title, description, video_url, release_days')
                    .eq('id', lessonId)
                    .single();

                if (fallbackData) {
                    setTitle(fallbackData.title);
                    setDescription(fallbackData.description || '');
                    setVideoUrl(fallbackData.video_url || '');
                    setReleaseDays(fallbackData.release_days || 0);
                } else {
                    setError(fallbackError?.message || 'Failed to fetch lesson data.');
                }
            } else {
                // For any other unexpected errors
                setError(error?.message || 'Failed to fetch lesson data.');
            }
            setFormLoading(false);
        };

        fetchLesson();
    }, [lessonId]);

    const handleTranscriptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setTranscript(text);
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const lessonData: { [key: string]: any } = {
            title,
            description,
            video_url: videoUrl,
            release_days: releaseDays,
        };

        if (transcriptColumnExists) {
            lessonData.transcript = transcript;
        }

        const { error: updateError } = await supabase
            .from('lessons')
            .update(lessonData)
            .eq('id', lessonId);

        setLoading(false);
        if (updateError) {
            setError(updateError.message);
        } else {
            onLessonUpdated();
            // After saving, trigger the embedding generation if a transcript exists
            if (transcript) {
                supabase.functions.invoke('generate-embeddings', {
                    body: { lesson_id: lessonId },
                });
            }
        }
    };
    
    if (formLoading) return <p>Carregando editor de aula...</p>;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-lg font-semibold">Editar Aula</h4>
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

            {transcriptColumnExists && (
                <>
                    <div>
                        <label htmlFor="transcriptFile" className="block text-sm font-medium text-gray-300 mb-2">Transcrição da Aula</label>
                        <p className="text-xs text-gray-400 mb-2">Envie um arquivo (.txt, .srt, .vtt) ou cole o texto abaixo.</p>
                        <input 
                            id="transcriptFile" 
                            type="file" 
                            onChange={handleTranscriptFileChange} 
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-700" 
                            accept=".txt,.srt,.vtt"
                        />
                    </div>

                    <div>
                        <textarea 
                            id="transcriptText" 
                            value={transcript} 
                            onChange={(e) => setTranscript(e.target.value)} 
                            className="w-full bg-black/20 border border-white/20 rounded-md py-2 px-4 mt-2" 
                            rows={8}
                            placeholder="O conteúdo do arquivo de transcrição aparecerá aqui..."
                        ></textarea>
                    </div>
                </>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end space-x-4 pt-2">
                <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">Cancelar</button>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    );
};

export default EditLessonForm;