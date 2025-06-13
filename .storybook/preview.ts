import type { Preview } from "@storybook/react"
import "../src/app/globals.css"

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: "^on[A-Z].*" },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        backgrounds: {
            default: "light",
            values: [
                {
                    name: "light",
                    value: "#ffffff",
                },
                {
                    name: "dark",
                    value: "#1a1a1a",
                },
            ],
        },
        viewport: {
            viewports: {
                mobile: {
                    name: "Mobile",
                    styles: {
                        width: "375px",
                        height: "667px",
                    },
                },
                tablet: {
                    name: "Tablet",
                    styles: {
                        width: "768px",
                        height: "1024px",
                    },
                },
                desktop: {
                    name: "Desktop",
                    styles: {
                        width: "1280px",
                        height: "720px",
                    },
                },
            },
        },

        a11y: {
            // 'todo' - show a11y violations in the test UI only
            // 'error' - fail CI on a11y violations
            // 'off' - skip a11y checks entirely
            test: "todo",
        },
    },
}

export default preview
