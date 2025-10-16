import React from 'react';

const Footer: React.FC = () => {

    const footerLinks = [
        'Perguntas frequentes', 'Central de Ajuda', 'Termos de Uso',
        'Privacidade', 'Preferências de cookies', 'Informações corporativas',
    ];

    return (
        <footer className="bg-transparent text-gray-400 pt-12 pb-24">
            <div className="max-w-screen-lg mx-auto px-4 md:px-16">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    {footerLinks.map(link => (
                        <a key={link} href="#" className="hover:underline mb-3 block">{link}</a>
                    ))}
                </div>
                <p className="text-xs mt-8">&copy; 2024 CursosFlix, Inc.</p>
            </div>
        </footer>
    );
};

export default Footer;
