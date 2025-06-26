import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Todo List',
    description:
        'A smart todo list application with Google Calendar integration',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang='zh-TW'>
            <head>
                <link
                    href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
                    rel='stylesheet'
                />                
            </head>
            <body>
                {children}
                <script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'></script>
            </body>
        </html>
    );
}
