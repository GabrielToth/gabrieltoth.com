# Boas Práticas - Kiro Agent

## 📋 Instruções Gerais

### 1. Documentação
- **NÃO** gere arquivos `.md` de resumo após completar tasks
- **NÃO** crie relatórios de mudanças em `.md` a menos que explicitamente solicitado
- **APENAS** crie `.md` quando o usuário pedir especificamente um arquivo de documentação
- Resuma mudanças diretamente na resposta em texto simples

### 2. Commits e Git
- Sempre use mensagens de commit descritivas e em inglês
- Prefira commits atômicos (uma mudança por commit)
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, etc.
- Não faça push automaticamente - sempre confirme antes

### 3. Código
- Mantenha consistência com o estilo do projeto
- Siga as convenções de nomenclatura existentes
- Não adicione dependências sem confirmar
- Sempre teste antes de fazer commit

### 4. Respostas
- Seja conciso e direto
- Use listas e tabelas para organizar informações
- Mostre apenas o essencial
- Se precisar de detalhes, o usuário pedirá

### 5. Arquivos Descartáveis
- Não envie para git: relatórios de mudanças, sumários, listas de tarefas
- Esses arquivos devem ser criados APENAS se o usuário pedir explicitamente
- Exemplo: "crie um relatório.md" ou "documente as mudanças"

## 🎯 Fluxo de Trabalho

1. **Entender** a tarefa
2. **Implementar** as mudanças
3. **Testar** se possível
4. **Resumir** na resposta (sem .md)
5. **Fazer commit** com mensagem clara
6. **Confirmar** antes de push

## ✅ Checklist Antes de Responder

- [ ] Tarefa foi completada?
- [ ] Código foi testado?
- [ ] Commit foi feito?
- [ ] Preciso gerar .md? (Apenas se solicitado)
- [ ] Resumo está claro e conciso?

## 📝 Exemplo de Resposta Correta

```
✅ Implementado com sucesso

Mudanças:
- Arquivo A: adicionado função X
- Arquivo B: atualizado import Y
- Arquivo C: removido código Z

Commit: abc1234 - feat: implement feature X
Status: Pronto para push
```

## ❌ Exemplo de Resposta Incorreta

```
[Gera arquivo MUDANCAS.md]
[Gera arquivo RELATORIO.md]
[Gera arquivo SUMARIO.md]
```

---

**Última atualização:** 16 de Abril de 2026
