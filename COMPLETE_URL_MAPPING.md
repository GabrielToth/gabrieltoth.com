# Mapeamento Completo de URLs - Todas as Páginas

## 📋 Estrutura de Páginas do Site

### 1. **Home / Landing Page**
- **Rota Atual:** `/{locale}` (home)
- **Descrição:** Página inicial do site
- **Tipo:** Landing page
- **Variações por Idioma:**
  - PT-BR: `/pt-BR` ✅ (já correto)
  - EN: `/en` ✅ (já correto)
  - ES: `/es` ✅ (já correto)
  - DE: `/de` ✅ (já correto)

---

### 2. **Quem Sou Eu / About Me**
- **Rota Atual:** `/{locale}/quem-sou-eu`
- **Descrição:** Página de perfil pessoal
- **Tipo:** Language-Independent (NOVO)
- **Variações por Idioma:**
  - PT-BR: `/gabriel-toth-goncalves` ✅ (NOVO)
  - EN: `/gabriel-toth-goncalves` ✅ (NOVO)
  - ES: `/gabriel-toth-goncalves` ✅ (NOVO)
  - DE: `/gabriel-toth-goncalves` ✅ (NOVO)

---

### 3. **PC Optimization / Otimização de PC**
- **Rota Atual:** `/{locale}/pc-optimization`
- **Descrição:** Serviço de otimização de PC
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/otimizacao-de-pc` ❌ (atualmente `/pt-BR/pc-optimization`)
  - EN: `/en/pc-optimization` ✅ (correto)
  - ES: `/es/optimizacion-de-pc` ❌ (atualmente `/es/pc-optimization`)
  - DE: `/de/pc-optimierung` ❌ (atualmente `/de/pc-optimization`)

**Redirecionamentos Necessários:**
```
/pt-BR/pc-optimization → /pt-BR/otimizacao-de-pc
/es/pc-optimization → /es/optimizacion-de-pc
/de/pc-optimization → /de/pc-optimierung
```

---

### 4. **PC Optimization Terms / Termos de Otimização**
- **Rota Atual:** `/{locale}/pc-optimization/terms`
- **Descrição:** Termos e condições da otimização de PC
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/otimizacao-de-pc/termos` ❌
  - EN: `/en/pc-optimization/terms` ✅
  - ES: `/es/optimizacion-de-pc/terminos` ❌
  - DE: `/de/pc-optimierung/bedingungen` ❌

---

### 5. **Channel Management / Gerenciamento de Canais (ViraTrend)**
- **Rota Atual:** `/{locale}/channel-management`
- **Descrição:** Serviço de gerenciamento de canais (ViraTrend)
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/gerenciamento-de-canais` ❌ (atualmente `/pt-BR/channel-management`)
  - EN: `/en/channel-management` ✅ (correto)
  - ES: `/es/gestion-de-canales` ❌ (atualmente `/es/channel-management`)
  - DE: `/de/kanalverwaltung` ❌ (atualmente `/de/channel-management`)

**Redirecionamentos Necessários:**
```
/pt-BR/channel-management → /pt-BR/gerenciamento-de-canais
/es/channel-management → /es/gestion-de-canales
/de/channel-management → /de/kanalverwaltung
```

---

### 6. **Editors / Editores**
- **Rota Atual:** `/{locale}/editors`
- **Descrição:** Página de editores
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/editores` ❌ (atualmente `/pt-BR/editors`)
  - EN: `/en/editors` ✅ (correto)
  - ES: `/es/editores` ❌ (atualmente `/es/editors`)
  - DE: `/de/editoren` ❌ (atualmente `/de/editors`)

**Redirecionamentos Necessários:**
```
/pt-BR/editors → /pt-BR/editores
/es/editors → /es/editores
/de/editors → /de/editoren
```

---

### 7. **IQ Test / Teste de QI**
- **Rota Atual:** `/{locale}/iq-test`
- **Descrição:** Teste de inteligência
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/teste-de-qi` ❌ (atualmente `/pt-BR/iq-test`)
  - EN: `/en/iq-test` ✅ (correto)
  - ES: `/es/prueba-de-ci` ❌ (atualmente `/es/iq-test`)
  - DE: `/de/iq-test` ✅ (correto em alemão também)

**Redirecionamentos Necessários:**
```
/pt-BR/iq-test → /pt-BR/teste-de-qi
/es/iq-test → /es/prueba-de-ci
```

---

### 8. **IQ Test Step / Etapa do Teste de QI**
- **Rota Atual:** `/{locale}/iq-test/step/[step]`
- **Descrição:** Etapas do teste de QI
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/teste-de-qi/etapa/[step]` ❌
  - EN: `/en/iq-test/step/[step]` ✅
  - ES: `/es/prueba-de-ci/paso/[step]` ❌
  - DE: `/de/iq-test/schritt/[step]` ❌

---

### 9. **IQ Test Summary / Resumo do Teste de QI**
- **Rota Atual:** `/{locale}/iq-test/summary`
- **Descrição:** Resumo dos resultados do teste de QI
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/teste-de-qi/resumo` ❌
  - EN: `/en/iq-test/summary` ✅
  - ES: `/es/prueba-de-ci/resumen` ❌
  - DE: `/de/iq-test/zusammenfassung` ❌

---

### 10. **Personality Test / Teste de Personalidade**
- **Rota Atual:** `/{locale}/personality-test`
- **Descrição:** Teste de personalidade
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/teste-de-personalidade` ❌ (atualmente `/pt-BR/personality-test`)
  - EN: `/en/personality-test` ✅ (correto)
  - ES: `/es/prueba-de-personalidad` ❌ (atualmente `/es/personality-test`)
  - DE: `/de/personlichkeitstest` ❌ (atualmente `/de/personality-test`)

**Redirecionamentos Necessários:**
```
/pt-BR/personality-test → /pt-BR/teste-de-personalidade
/es/personality-test → /es/prueba-de-personalidad
/de/personality-test → /de/personlichkeitstest
```

---

### 11. **Personality Test Step / Etapa do Teste de Personalidade**
- **Rota Atual:** `/{locale}/personality-test/step/[step]`
- **Descrição:** Etapas do teste de personalidade
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/teste-de-personalidade/etapa/[step]` ❌
  - EN: `/en/personality-test/step/[step]` ✅
  - ES: `/es/prueba-de-personalidad/paso/[step]` ❌
  - DE: `/de/personlichkeitstest/schritt/[step]` ❌

---

### 12. **Personality Test Summary / Resumo do Teste de Personalidade**
- **Rota Atual:** `/{locale}/personality-test/summary`
- **Descrição:** Resumo dos resultados do teste de personalidade
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/teste-de-personalidade/resumo` ❌
  - EN: `/en/personality-test/summary` ✅
  - ES: `/es/prueba-de-personalidad/resumen` ❌
  - DE: `/de/personlichkeitstest/zusammenfassung` ❌

---

### 13. **Amazon Affiliate / Afiliados Amazon**
- **Rota Atual:** `/{locale}/amazon-affiliate`
- **Descrição:** Programa de afiliados Amazon
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/afiliados-amazon` ❌ (atualmente `/pt-BR/amazon-affiliate`)
  - EN: `/en/amazon-affiliate` ✅ (correto)
  - ES: `/es/afiliados-amazon` ❌ (atualmente `/es/amazon-affiliate`)
  - DE: `/de/amazon-partner` ❌ (atualmente `/de/amazon-affiliate`)

**Redirecionamentos Necessários:**
```
/pt-BR/amazon-affiliate → /pt-BR/afiliados-amazon
/es/amazon-affiliate → /es/afiliados-amazon
/de/amazon-affiliate → /de/amazon-partner
```

---

### 14. **WaveIGL Support / Apoio WaveIGL**
- **Rota Atual:** `/{locale}/waveigl-support`
- **Descrição:** Página de apoio ao projeto WaveIGL
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/apoio-waveigl` ❌ (atualmente `/pt-BR/waveigl-support`)
  - EN: `/en/waveigl-support` ✅ (correto)
  - ES: `/es/apoyo-waveigl` ❌ (atualmente `/es/waveigl-support`)
  - DE: `/de/waveigl-unterstutzung` ❌ (atualmente `/de/waveigl-support`)

**Redirecionamentos Necessários:**
```
/pt-BR/waveigl-support → /pt-BR/apoio-waveigl
/es/waveigl-support → /es/apoyo-waveigl
/de/waveigl-support → /de/waveigl-unterstutzung
```

---

### 15. **Privacy Policy / Política de Privacidade**
- **Rota Atual:** `/{locale}/privacy-policy`
- **Descrição:** Política de privacidade
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/politica-de-privacidade` ❌ (atualmente `/pt-BR/privacy-policy`)
  - EN: `/en/privacy-policy` ✅ (correto)
  - ES: `/es/politica-de-privacidad` ❌ (atualmente `/es/privacy-policy`)
  - DE: `/de/datenschutzrichtlinie` ❌ (atualmente `/de/privacy-policy`)

**Redirecionamentos Necessários:**
```
/pt-BR/privacy-policy → /pt-BR/politica-de-privacidade
/es/privacy-policy → /es/politica-de-privacidad
/de/privacy-policy → /de/datenschutzrichtlinie
```

---

### 16. **Terms of Service / Termos de Serviço**
- **Rota Atual:** `/{locale}/terms-of-service`
- **Descrição:** Termos de serviço
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/termos-de-servico` ❌ (atualmente `/pt-BR/terms-of-service`)
  - EN: `/en/terms-of-service` ✅ (correto)
  - ES: `/es/terminos-de-servicio` ❌ (atualmente `/es/terms-of-service`)
  - DE: `/de/nutzungsbedingungen` ❌ (atualmente `/de/terms-of-service`)

**Redirecionamentos Necessários:**
```
/pt-BR/terms-of-service → /pt-BR/termos-de-servico
/es/terms-of-service → /es/terminos-de-servicio
/de/terms-of-service → /de/nutzungsbedingungen
```

---

### 17. **Login / Entrar**
- **Rota Atual:** `/{locale}/login`
- **Descrição:** Página de login
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/entrar` ❌ (atualmente `/pt-BR/login`)
  - EN: `/en/login` ✅ (correto)
  - ES: `/es/iniciar-sesion` ❌ (atualmente `/es/login`)
  - DE: `/de/anmelden` ❌ (atualmente `/de/login`)

**Redirecionamentos Necessários:**
```
/pt-BR/login → /pt-BR/entrar
/es/login → /es/iniciar-sesion
/de/login → /de/anmelden
```

---

### 18. **Register / Registrar**
- **Rota Atual:** `/{locale}/register`
- **Descrição:** Página de registro
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/registrar` ❌ (atualmente `/pt-BR/register`)
  - EN: `/en/register` ✅ (correto)
  - ES: `/es/registrarse` ❌ (atualmente `/es/register`)
  - DE: `/de/registrieren` ❌ (atualmente `/de/register`)

**Redirecionamentos Necessários:**
```
/pt-BR/register → /pt-BR/registrar
/es/register → /es/registrarse
/de/register → /de/registrieren
```

---

### 19. **Payments / Pagamentos**
- **Rota Atual:** `/{locale}/payments`
- **Descrição:** Página de pagamentos
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/pagamentos` ❌ (atualmente `/pt-BR/payments`)
  - EN: `/en/payments` ✅ (correto)
  - ES: `/es/pagos` ❌ (atualmente `/es/payments`)
  - DE: `/de/zahlungen` ❌ (atualmente `/de/payments`)

**Redirecionamentos Necessários:**
```
/pt-BR/payments → /pt-BR/pagamentos
/es/payments → /es/pagos
/de/payments → /de/zahlungen
```

---

### 20. **Payments Checkout / Checkout de Pagamentos**
- **Rota Atual:** `/{locale}/payments/checkout`
- **Descrição:** Página de checkout
- **Tipo:** Locale-based (PRECISA AJUSTE)
- **Variações Necessárias:**
  - PT-BR: `/pt-BR/pagamentos/checkout` ❌
  - EN: `/en/payments/checkout` ✅
  - ES: `/es/pagos/checkout` ❌
  - DE: `/de/zahlungen/checkout` ❌

---

## 📊 Resumo de Mudanças Necessárias

### Total de Páginas: 20
### Páginas Corretas: 2 (Home, About)
### Páginas que Precisam Ajuste: 18

### Redirecionamentos Necessários: 54

| Idioma | PT-BR | EN | ES | DE |
|--------|-------|----|----|-----|
| **Páginas Corretas** | 1 | 11 | 1 | 1 |
| **Páginas a Ajustar** | 17 | 0 | 17 | 17 |
| **Total de Redirecionamentos** | 17 | 0 | 17 | 17 |

---

## 🎯 Próximas Etapas

1. ✅ Criar estrutura de diretórios para cada idioma
2. ✅ Mover/copiar páginas para novos diretórios
3. ✅ Atualizar middleware com todos os redirecionamentos
4. ✅ Atualizar links de navegação no header
5. ✅ Atualizar testes
6. ✅ Atualizar sitemap
7. ✅ Fazer commit e push

---

**Documento Gerado:** 16 de Abril de 2026
