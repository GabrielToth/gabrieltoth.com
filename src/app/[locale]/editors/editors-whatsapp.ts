export const getApplicationTemplate = (locale: "en" | "pt-BR") => {
    if (locale === "pt-BR") {
        return `Olá! Gostaria de me candidatar para a vaga de editor de vídeos.

*FORMULÁRIO DE CANDIDATURA*

Nome Completo:
Idade:
Portfolio (links):
Experiência com edição (anos) (não precisa ter):

*Software que domina:*
- Premiere Pro: (Básico/Intermediário/Avançado)
- After Effects: (Básico/Intermediário/Avançado)
- DaVinci Resolve: (Básico/Intermediário/Avançado)
- Outros:

Aguardo retorno! 😊`
    }

    return `Hi! I would like to apply for the video editor position.

*APPLICATION FORM*

Full Name:
Age:
Portfolio (links):
Editing Experience (years) (no need to have):

*Software Proficiency:*
- Premiere Pro: (Basic/Intermediate/Advanced)
- After Effects: (Basic/Intermediate/Advanced)
- DaVinci Resolve: (Basic/Intermediate/Advanced)
- Others:

Looking forward to hearing back! 😊`
}
