import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';

interface Module {
    id: number;
    title: string;
    order: number;
}

interface Lesson {
    id: number;
    title: string;
    order: number;
    module_id: number;
}

interface CourseStructureNavProps {
    courseId: number;
    onSelectItem: (type: 'module' | 'lesson', id: number) => void;
    onShowAddForm: (type: 'module' | 'lesson', moduleId?: number) => void;
    refreshKey: boolean;
}

const CourseStructureNav: React.FC<CourseStructureNavProps> = ({ courseId, onSelectItem, onShowAddForm, refreshKey }) => {
    const [modules, setModules] = useState<Module[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            const { data: modulesData, error: modulesError } = await supabase
                .from('modules').select('id, title, order').eq('course_id', courseId).order('order');

            if (modulesError) {
                setError(modulesError.message);
                setLoading(false);
                return;
            }

            const moduleIds = modulesData.map(m => m.id);
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons').select('id, title, order, module_id').in('module_id', moduleIds).order('order');

            if (lessonsError) {
                setError(lessonsError.message);
            } else {
                setModules(modulesData || []);
                setLessons(lessonsData || []);
            }
            setLoading(false);
        };

        fetchData();
    }, [courseId, refreshKey]);

    const lessonsByModule = lessons.reduce((acc, lesson) => {
        (acc[lesson.module_id] = acc[lesson.module_id] || []).push(lesson);
        return acc;
    }, {} as Record<number, Lesson[]>);

    if (loading) return <p>Carregando estrutura...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="space-y-4">
            {modules.map(module => (
                <div key={module.id}>
                    <div 
                        className="bg-gray-700/50 p-3 rounded-md cursor-pointer hover:bg-gray-700/80"
                        onClick={() => onSelectItem('module', module.id)}
                    >
                        <h4 className="font-bold">{module.title}</h4>
                    </div>
                    <div className="pl-4 mt-2 space-y-2 border-l-2 border-gray-600">
                        {(lessonsByModule[module.id] || []).map(lesson => (
                            <div 
                                key={lesson.id} 
                                className="bg-gray-800/50 p-2 rounded-md cursor-pointer hover:bg-gray-800/80"
                                onClick={() => onSelectItem('lesson', lesson.id)}
                            >
                                <p className="text-sm">{lesson.title}</p>
                            </div>
                        ))}
                        <button onClick={() => onShowAddForm('lesson', module.id)} className="text-xs text-blue-400 hover:underline pt-1">+ Adicionar Aula</button>
                    </div>
                </div>
            ))}
            <button onClick={() => onShowAddForm('module')} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                + Adicionar Módulo
            </button>
        </div>
    );
};

export default CourseStructureNav;
