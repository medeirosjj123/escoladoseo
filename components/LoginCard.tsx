import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getEmbedUrl } from '../src/videoUtils';
import { PlayIcon, AddIcon, LikeIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

// --- Type Definitions ---
export interface Lesson {
    id: string;
    title: string;
    duration: string;
    completed: boolean;
    progress?: number;
    description?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
}

export interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
}
export interface Episode {
    number: number;
    title: string;
    description: string;
    duration: string;
    thumbnailUrl: string;
}

export interface Course {
    id: string;
    cardKey?: string;
    firstLessonId?: string;
    previewVideoUrl?: string;
    posterUrl: string;
    heroUrl: string;
    title: string;
    instructor: string;
    relevance: string;
    duration: string;
    totalLessons: number;
    level: string;
    tags: string[];
    progress?: number;
    year: number;
    ageRating: string;
    seasons: number;
    description: string;
    cast: string[];
    genres: string[];
    tagsDetail: string[];
    episodes: { [season: string]: Episode[]; };
    modules: Module[];
    isContinueWatching?: boolean;
    lessonTitle?: string;
    moduleOrder?: number;
    lessonOrder?: number;
    progressSeconds?: number;
    totalDurationSeconds?: number;
}

// --- HoverCard Component (Portal) ---
interface HoverCardProps {
    course: Course;
    rect: DOMRect;
    scrollY: number;
    onCardClick: (course: Course) => void;
    onShowDetails: (course: Course) => void;
    startClosing: () => void;
    isClosing: boolean;
    onCloseAnimationEnd: () => void;
    onMouseEnter: () => void;
}
export const HoverCard: React.FC<HoverCardProps> = ({ course, rect, scrollY, onCardClick, onShowDetails, startClosing, isClosing, onCloseAnimationEnd, onMouseEnter }) => {
    const portalRoot = document.getElementById('modal-root');
    const [isMounted, setIsMounted] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const cardRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const timer = requestAnimationFrame(() => setIsMounted(true));
        return () => cancelAnimationFrame(timer);
    }, []);

    useEffect(() => {
        setIsVideoLoading(true);
    }, [course.cardKey]);

    useEffect(() => {
        const node = cardRef.current;
        if (!node) return;
        const handleTransitionEnd = (event: TransitionEvent) => {
            if (event.propertyName === 'transform' && isClosing) onCloseAnimationEnd();
        };
        node.addEventListener('transitionend', handleTransitionEnd);
        return () => node.removeEventListener('transitionend', handleTransitionEnd);
    }, [isClosing, onCloseAnimationEnd]);

    if (!portalRoot || !rect) return null;

    const style = { position: 'absolute' as const, top: `${rect.top + scrollY}px`, left: `${rect.left + window.scrollX}px`, width: `${rect.width}px`, height: `${rect.height}px` };
    const video = getEmbedUrl(course.previewVideoUrl);

    useEffect(() => {
        if (video.type === 'iframe') {
            const timer = setTimeout(() => {
                setIsVideoLoading(false);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [video.type, course.cardKey]);

    const handleTimeUpdate = () => {
        if (videoRef.current && videoRef.current.currentTime >= 20) {
            videoRef.current.pause();
        }
    };

    let originClass = 'origin-center';
    const cardWidth = rect.width;
    const windowWidth = window.innerWidth;
    if (rect.left < cardWidth) {
        originClass = 'origin-left';
    } 
    else if (rect.right > windowWidth - cardWidth) {
        originClass = 'origin-right';
    }

    return ReactDOM.createPortal(
        <div style={style} className="z-50" onMouseEnter={onMouseEnter} onMouseLeave={startClosing}>
            <div ref={cardRef} className={`absolute inset-0 transform ${originClass} transition-all duration-300 ease-in-out ${isMounted && !isClosing ? 'scale-[1.5] opacity-100 -translate-y-10' : 'scale-100 opacity-0 translate-y-0'}`}>
                <div className="shadow-[0_15px_60px_-10px_rgba(0,0,0,0.6)] rounded-md">
                    <div className="bg-[#141414] rounded-md overflow-hidden w-full flex flex-col">
                        <div className="w-full aspect-video bg-black relative">
                            {video.url && (
                                video.type === 'iframe' ? (
                                    <iframe src={video.url} className="w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>
                                ) : (
                                    <video key={course.previewVideoUrl} ref={videoRef} src={video.url} autoPlay muted playsInline className="w-full h-full object-cover" onPlaying={() => setIsVideoLoading(false)} onTimeUpdate={handleTimeUpdate} />
                                )
                            )}
                            <img src={course.posterUrl} alt={course.title} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isVideoLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
                        </div>
                        <div className="p-3 space-y-3">
                             <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black" onClick={(e) => { e.stopPropagation(); onCardClick(course); }}><PlayIcon /></button>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-400 text-white hover:border-white" onClick={(e) => { e.stopPropagation(); console.log('add'); }}><AddIcon /></button>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-400 text-white hover:border-white" onClick={(e) => { e.stopPropagation(); console.log('like'); }}><LikeIcon /></button>
                                </div>
                                <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-400 text-white hover:border-white" onClick={(e) => { e.stopPropagation(); onShowDetails(course); }}>
                                    <ChevronDownIcon />
                                </button>
                            </div>
                            <div className="text-white space-y-2">
                                {course.isContinueWatching ? (
                                    <>
                                        <p className="font-bold text-base">{`M${course.moduleOrder}:A${course.lessonOrder} ${course.lessonTitle}`}</p>
                                        <div className="w-full bg-zinc-600 rounded-full h-1 overflow-hidden">
                                            <div className="bg-red-600 h-1" style={{ width: `${course.progress || 0}%` }}></div>
                                        </div>
                                        {course.totalDurationSeconds != null && course.progressSeconds != null && (
                                            <p className="text-xs text-gray-400">
                                                {`${Math.floor(course.totalDurationSeconds / 60) - Math.floor(course.progressSeconds / 60)} min restantes`}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <p className="font-bold text-base">{course.title}</p>
                                        </div>
                                        <div className="flex items-center space-x-3 text-xs text-gray-400">
                                            <span>{course.totalLessons} aulas</span>
                                            <span>{course.duration}</span>
                                            <span className="border border-gray-400 px-1.5 text-[10px]">HD</span>
                                        </div>
                                        <div className="flex items-center text-xs text-gray-300 space-x-1.5 flex-wrap">
                                            {course.tags.slice(0, 3).map((tag, index) => (
                                                <React.Fragment key={index}>
                                                    <span>{tag}</span>
                                                    {index < course.tags.length - 1 && <span className="text-gray-600">•</span>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        portalRoot
    );
};

// --- CourseCard Component (Simplified) ---
interface CourseCardProps {
    course: Course;
    onMouseEnter: (course: Course, rect: DOMRect) => void;
    onClick: (course: Course) => void;
}
const CourseCard: React.FC<CourseCardProps> = ({ course, onMouseEnter, onClick }) => {
    return (
        <div
            className="flex-shrink-0 w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 xl:w-1/6 px-1 cursor-pointer"
            onMouseEnter={(e) => onMouseEnter(course, e.currentTarget.getBoundingClientRect())}
            onClick={() => onClick(course)}
        >
            <div className="aspect-[16/9] w-full relative">
                <img src={course.posterUrl} alt={course.title} className="w-full h-full object-cover rounded-md" />
                {course.progress && (
                    <div className="absolute bottom-1.5 left-2 right-2 h-1 bg-zinc-600 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600" style={{ width: `${course.progress}%` }}></div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- CourseCarousel Component ---
interface CourseCarouselProps {
    title: string;
    courses: Course[];
    onCardClick: (course: Course) => void;
    onShowDetails: (course: Course) => void;
    onMouseEnter: (course: Course, rect: DOMRect) => void;
    onMouseLeave: () => void;
}

const CourseCarousel: React.FC<CourseCarouselProps> = ({ title, courses, onCardClick, onShowDetails, onMouseEnter, onMouseLeave }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollButtons = () => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setCanScrollLeft(scrollLeft > 5);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        checkScrollButtons();
        const timer = setTimeout(checkScrollButtons, 500);
        container.addEventListener('scroll', checkScrollButtons);
        window.addEventListener('resize', checkScrollButtons);
        return () => {
            clearTimeout(timer);
            if (container) container.removeEventListener('scroll', checkScrollButtons);
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [courses]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { clientWidth } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.75;
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };
    
    return (
        <div className="group/carousel relative" onMouseLeave={onMouseLeave}>
            <h2 className="text-xl md:text-2xl font-bold px-4 md:px-16 mb-3">{title}</h2>
            <div className="relative">
                {canScrollLeft && (
                    <button onClick={() => scroll('left')} className="absolute left-0 top-0 bottom-0 z-30 w-16 bg-gradient-to-r from-[#141414] via-[#141414]/80 to-transparent flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                        <ChevronLeftIcon />
                    </button>
                )}
                <div ref={scrollContainerRef} className="flex overflow-x-auto scrollbar-hide -mx-1 px-4 md:px-16">
                    {courses.map((course) => (
                        <CourseCard 
                            key={course.cardKey || course.id} 
                            course={course}
                            onMouseEnter={onMouseEnter}
                            onClick={onCardClick}
                        />
                    ))}
                </div>
                {canScrollRight && (
                    <button onClick={() => scroll('right')} className="absolute right-0 top-0 bottom-0 z-30 w-16 bg-gradient-to-l from-[#141414] via-[#141414]/80 to-transparent flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                        <ChevronRightIcon />
                    </button>
                )}
            </div>
        </div>
    );
};

export default CourseCarousel;