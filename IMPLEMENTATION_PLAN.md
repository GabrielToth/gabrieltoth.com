# Plano de Implementação - URLs Multilíngues Completas

## 🎯 Objetivo
Implementar URLs em idiomas apropriados para TODAS as páginas do site, garantindo que:
- URLs em português para conteúdo em português
- URLs em inglês para conteúdo em inglês
- URLs em espanhol para conteúdo em espanhol
- URLs em alemão para conteúdo em alemão

## 📋 Estratégia de Implementação

### Fase 1: Preparação (Atual)
- [x] Mapear todas as páginas do site
- [x] Identificar variações necessárias por idioma
- [x] Criar plano de redirecionamentos
- [ ] Criar estrutura de diretórios

### Fase 2: Implementação de Diretórios
- [ ] Criar diretórios para cada página em cada idioma
- [ ] Mover/copiar arquivos de página
- [ ] Atualizar imports e referências

### Fase 3: Middleware e Redirecionamentos
- [ ] Atualizar middleware.ts com todos os redirecionamentos
- [ ] Testar redirecionamentos

### Fase 4: Navegação e Links
- [ ] Atualizar header.tsx com novas URLs
- [ ] Atualizar links internos
- [ ] Atualizar breadcrumbs

### Fase 5: Testes
- [ ] Atualizar testes E2E
- [ ] Atualizar testes unitários
- [ ] Verificar compatibilidade

### Fase 6: Deploy
- [ ] Fazer commit
- [ ] Fazer push
- [ ] Monitorar redirecionamentos

---

## 🗂️ Estrutura de Diretórios Necessária

### Estrutura Atual (Locale-based):
```
src/app/[locale]/
├── pc-optimization/
├── channel-management/
├── editors/
├── iq-test/
├── personality-test/
├── amazon-affiliate/
├── waveigl-support/
├── privacy-policy/
├── terms-of-service/
├── login/
├── register/
├── payments/
└── ...
```

### Estrutura Nova (Language-specific):
```
src/app/
├── pt-BR/
│   ├── otimizacao-de-pc/
│   ├── gerenciamento-de-canais/
│   ├── editores/
│   ├── teste-de-qi/
│   ├── teste-de-personalidade/
│   ├── afiliados-amazon/
│   ├── apoio-waveigl/
│   ├── politica-de-privacidade/
│   ├── termos-de-servico/
│   ├── entrar/
│   ├── registrar/
│   ├── pagamentos/
│   └── ...
├── en/
│   ├── pc-optimization/
│   ├── channel-management/
│   ├── editors/
│   ├── iq-test/
│   ├── personality-test/
│   ├── amazon-affiliate/
│   ├── waveigl-support/
│   ├── privacy-policy/
│   ├── terms-of-service/
│   ├── login/
│   ├── register/
│   ├── payments/
│   └── ...
├── es/
│   ├── optimizacion-de-pc/
│   ├── gestion-de-canales/
│   ├── editores/
│   ├── prueba-de-ci/
│   ├── prueba-de-personalidad/
│   ├── afiliados-amazon/
│   ├── apoyo-waveigl/
│   ├── politica-de-privacidad/
│   ├── terminos-de-servicio/
│   ├── iniciar-sesion/
│   ├── registrarse/
│   ├── pagos/
│   └── ...
├── de/
│   ├── pc-optimierung/
│   ├── kanalverwaltung/
│   ├── editoren/
│   ├── iq-test/
│   ├── personlichkeitstest/
│   ├── amazon-partner/
│   ├── waveigl-unterstutzung/
│   ├── datenschutzrichtlinie/
│   ├── nutzungsbedingungen/
│   ├── anmelden/
│   ├── registrieren/
│   ├── zahlungen/
│   └── ...
└── gabriel-toth-goncalves/ (language-independent)
```

---

## 🔄 Mapeamento de Redirecionamentos

### PT-BR (17 redirecionamentos)
```
/pt-BR/pc-optimization → /pt-BR/otimizacao-de-pc
/pt-BR/channel-management → /pt-BR/gerenciamento-de-canais
/pt-BR/editors → /pt-BR/editores
/pt-BR/iq-test → /pt-BR/teste-de-qi
/pt-BR/iq-test/step → /pt-BR/teste-de-qi/etapa
/pt-BR/iq-test/summary → /pt-BR/teste-de-qi/resumo
/pt-BR/personality-test → /pt-BR/teste-de-personalidade
/pt-BR/personality-test/step → /pt-BR/teste-de-personalidade/etapa
/pt-BR/personality-test/summary → /pt-BR/teste-de-personalidade/resumo
/pt-BR/amazon-affiliate → /pt-BR/afiliados-amazon
/pt-BR/waveigl-support → /pt-BR/apoio-waveigl
/pt-BR/privacy-policy → /pt-BR/politica-de-privacidade
/pt-BR/terms-of-service → /pt-BR/termos-de-servico
/pt-BR/login → /pt-BR/entrar
/pt-BR/register → /pt-BR/registrar
/pt-BR/payments → /pt-BR/pagamentos
/pt-BR/payments/checkout → /pt-BR/pagamentos/checkout
```

### ES (17 redirecionamentos)
```
/es/pc-optimization → /es/optimizacion-de-pc
/es/channel-management → /es/gestion-de-canales
/es/editors → /es/editores
/es/iq-test → /es/prueba-de-ci
/es/iq-test/step → /es/prueba-de-ci/paso
/es/iq-test/summary → /es/prueba-de-ci/resumen
/es/personality-test → /es/prueba-de-personalidad
/es/personality-test/step → /es/prueba-de-personalidad/paso
/es/personality-test/summary → /es/prueba-de-personalidad/resumen
/es/amazon-affiliate → /es/afiliados-amazon
/es/waveigl-support → /es/apoyo-waveigl
/es/privacy-policy → /es/politica-de-privacidad
/es/terms-of-service → /es/terminos-de-servicio
/es/login → /es/iniciar-sesion
/es/register → /es/registrarse
/es/payments → /es/pagos
/es/payments/checkout → /es/pagos/checkout
```

### DE (17 redirecionamentos)
```
/de/pc-optimization → /de/pc-optimierung
/de/channel-management → /de/kanalverwaltung
/de/editors → /de/editoren
/de/iq-test → /de/iq-test (sem mudança)
/de/iq-test/step → /de/iq-test/schritt
/de/iq-test/summary → /de/iq-test/zusammenfassung
/de/personality-test → /de/personlichkeitstest
/de/personality-test/step → /de/personlichkeitstest/schritt
/de/personality-test/summary → /de/personlichkeitstest/zusammenfassung
/de/amazon-affiliate → /de/amazon-partner
/de/waveigl-support → /de/waveigl-unterstutzung
/de/privacy-policy → /de/datenschutzrichtlinie
/de/terms-of-service → /de/nutzungsbedingungen
/de/login → /de/anmelden
/de/register → /de/registrieren
/de/payments → /de/zahlungen
/de/payments/checkout → /de/zahlungen/checkout
```

### EN (0 redirecionamentos)
```
Nenhum redirecionamento necessário - URLs já estão em inglês
```

---

## 📝 Mudanças de Código Necessárias

### 1. middleware.ts
- Adicionar mapa completo de redirecionamentos
- Implementar lógica para redirecionar URLs antigas

### 2. src/components/layout/header.tsx
- Atualizar links de navegação com novas URLs
- Implementar lógica para gerar URLs corretas por idioma

### 3. Testes
- Atualizar testes E2E
- Atualizar testes unitários

### 4. Sitemap
- Atualizar sitemap.xml para incluir novas URLs
- Remover URLs antigas

---

## ⚠️ Considerações Importantes

1. **Compatibilidade com i18n**: O sistema atual usa `[locale]` como parâmetro dinâmico. Precisamos manter essa estrutura mas com URLs traduzidas.

2. **Redirecionamentos Permanentes**: Usar código 308 para preservar autoridade de domínio.

3. **Backlinks**: URLs antigas com backlinks serão automaticamente redirecionadas.

4. **Analytics**: Monitorar tráfego para garantir que redirecionamentos estão funcionando.

5. **Cache**: Pode levar 24-48 horas para propagação completa.

---

## 🚀 Próximas Ações

1. Confirmar se deseja prosseguir com a implementação completa
2. Criar estrutura de diretórios
3. Mover/copiar arquivos
4. Atualizar middleware
5. Atualizar navegação
6. Testar
7. Deploy

---

**Documento Gerado:** 16 de Abril de 2026
