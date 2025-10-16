import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

export const useCourseAccess = (courseId: string | undefined) => {
    const { user } = useAuth();
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkCourseAccess = async () => {
            if (user && courseId) {
                try {
                    const { data, error } = await supabase
                        .from('user_courses')
                        .select('course_id')
                        .eq('user_id', user.id)
                        .eq('course_id', courseId)
                        .single();

                    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                        throw error;
                    }

                    setHasAccess(!!data);
                } catch (error: any) {
                    console.error('Error checking course access:', error.message);
                } finally {
                    setLoading(false);
                }
            }
        };

        checkCourseAccess();
    }, [user, courseId]);

    return { hasAccess, loading };
};
