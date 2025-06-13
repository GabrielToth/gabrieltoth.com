export function ThemeScript() {
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `
                (function() {
                    function setTheme() {
                        try {
                            var theme = localStorage.getItem('theme');
                            var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            var selectedTheme = theme || (systemPrefersDark ? 'dark' : 'light');

                            document.documentElement.classList.remove('light', 'dark');
                            document.documentElement.classList.add(selectedTheme);
                            document.documentElement.setAttribute('data-theme', selectedTheme);
                        } catch (e) {
                            document.documentElement.classList.remove('light', 'dark');
                            document.documentElement.classList.add('dark');
                            document.documentElement.setAttribute('data-theme', 'dark');
                        }
                    }

                    setTheme();
                })();
                `,
            }}
        />
    )
}
