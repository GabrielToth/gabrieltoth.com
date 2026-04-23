# Documento de Requisitos - Vinculação de Canais do YouTube

## Introdução

Este documento especifica os requisitos para implementar um sistema de vinculação segura de canais do YouTube com contas de usuários. O sistema deve permitir que usuários vinculem seus canais do YouTube, validar a propriedade através do OAuth do YouTube, prevenir duplicação de canais entre usuários, detectar atividades suspeitas e fornecer mecanismos de recuperação em caso de invasão.

## Glossário

- **Canal_YouTube**: Entidade no YouTube que representa um criador de conteúdo
- **Usuário**: Pessoa registrada no sistema com uma conta ativa
- **Vinculação**: Associação entre um Canal_YouTube e um Usuário
- **OAuth_YouTube**: Protocolo de autenticação do Google para validar propriedade de canais
- **Atividade_Suspeita**: Mudanças anormais em padrões de acesso (IP, localização, dispositivo)
- **Invasão**: Acesso não autorizado a uma conta de Usuário ou Canal_YouTube
- **Recuperação**: Processo de restaurar controle de um Canal_YouTube vinculado
- **Desvinculação**: Remoção da associação entre um Canal_YouTube e um Usuário
- **Histórico_Auditoria**: Registro de todas as ações de vinculação/desvinculação
- **Sistema**: A plataforma que gerencia vinculações de canais do YouTube

## Requisitos

### Requisito 1: Iniciar Processo de Vinculação

**User Story:** Como um usuário, quero vincular meu canal do YouTube à minha conta, para que eu possa gerenciar meu conteúdo através da plataforma.

#### Critérios de Aceitação

1. WHEN um usuário clica em "Vincular Canal do YouTube", THE Sistema SHALL redirecionar para a tela de autenticação OAuth do YouTube
2. THE Sistema SHALL solicitar permissões para acessar informações básicas do canal (ID, nome, descrição)
3. WHEN o usuário completa a autenticação OAuth, THE Sistema SHALL receber um token de acesso válido do YouTube
4. THE Sistema SHALL armazenar o token de acesso de forma segura (criptografado)

---

### Requisito 2: Validar Propriedade do Canal

**User Story:** Como o sistema, quero validar que o canal pertence ao usuário autenticado, para que eu possa garantir que apenas proprietários legítimos vinculem seus canais.

#### Critérios de Aceitação

1. WHEN um usuário completa a autenticação OAuth, THE Sistema SHALL fazer uma chamada à API do YouTube para recuperar informações do canal
2. THE Sistema SHALL verificar que o ID do canal retornado pela API corresponde ao ID fornecido pelo OAuth
3. IF a validação falhar, THEN THE Sistema SHALL exibir uma mensagem de erro e não permitir a vinculação
4. WHEN a validação for bem-sucedida, THE Sistema SHALL prosseguir para verificar duplicação

---

### Requisito 3: Prevenir Duplicação de Canais

**User Story:** Como o sistema, quero garantir que um canal do YouTube não seja vinculado a múltiplos usuários, para que eu possa manter integridade dos dados e evitar conflitos.

#### Critérios de Aceitação

1. WHEN um usuário tenta vincular um canal, THE Sistema SHALL consultar o banco de dados para verificar se o canal já está vinculado
2. IF o canal já está vinculado a outro usuário, THEN THE Sistema SHALL exibir uma tela de recuperação com opções de ação
3. IF o canal não está vinculado, THEN THE Sistema SHALL prosseguir com a vinculação
4. THE Sistema SHALL criar um registro único (constraint) no banco de dados para garantir que um canal não possa ser vinculado duas vezes

---

### Requisito 4: Oferecer Opções de Recuperação

**User Story:** Como um usuário, quero recuperar meu canal do YouTube se ele foi vinculado a outra conta, para que eu possa restaurar o acesso ao meu canal.

#### Critérios de Aceitação

1. WHEN um canal já está vinculado a outro usuário, THE Sistema SHALL exibir uma tela com opções de recuperação
2. THE Sistema SHALL oferecer a opção "Recuperar este canal" que inicia um processo de verificação de propriedade
3. WHEN o usuário clica em "Recuperar este canal", THE Sistema SHALL enviar um email de verificação para o endereço de email associado ao Canal_YouTube
4. THE Sistema SHALL exigir que o usuário confirme a recuperação através de um link único no email
5. WHEN o link de recuperação é confirmado, THE Sistema SHALL desassociar o canal do usuário anterior e vinculá-lo ao novo usuário
6. THE Sistema SHALL registrar a ação de recuperação no Histórico_Auditoria com detalhes de IP, localização e dispositivo

---

### Requisito 5: Detectar Atividades Suspeitas

**User Story:** Como o sistema, quero detectar padrões anormais de acesso, para que eu possa alertar usuários sobre possíveis invasões.

#### Critérios de Aceitação

1. WHEN uma vinculação é criada, THE Sistema SHALL registrar o IP, localização geográfica e tipo de dispositivo
2. WHEN uma desvinculação é solicitada, THE Sistema SHALL comparar o IP, localização e dispositivo com o registro anterior
3. IF o IP, localização ou dispositivo forem significativamente diferentes, THEN THE Sistema SHALL marcar como Atividade_Suspeita
4. WHEN uma Atividade_Suspeita é detectada, THE Sistema SHALL enviar um alerta por email ao usuário
5. THE Sistema SHALL exigir confirmação adicional (código enviado por email) antes de permitir a desvinculação em caso de Atividade_Suspeita

---

### Requisito 6: Manter Histórico de Auditoria

**User Story:** Como um administrador, quero visualizar o histórico completo de vinculações e desvinculações, para que eu possa investigar atividades suspeitas e garantir conformidade.

#### Critérios de Aceitação

1. THE Sistema SHALL registrar cada ação de vinculação no Histórico_Auditoria com timestamp, IP, localização, dispositivo e ID do usuário
2. THE Sistema SHALL registrar cada ação de desvinculação no Histórico_Auditoria com os mesmos detalhes
3. THE Sistema SHALL registrar cada tentativa de recuperação no Histórico_Auditoria, incluindo sucesso ou falha
4. THE Sistema SHALL registrar cada Atividade_Suspeita detectada no Histórico_Auditoria
5. THE Sistema SHALL permitir que administradores consultem o Histórico_Auditoria filtrado por usuário, canal ou período de tempo
6. THE Sistema SHALL manter o Histórico_Auditoria por no mínimo 2 anos

---

### Requisito 7: Permitir Desvinculação Segura

**User Story:** Como um usuário, quero desvincular meu canal do YouTube da minha conta, para que eu possa revogar o acesso da plataforma ao meu canal.

#### Critérios de Aceitação

1. WHEN um usuário clica em "Desvinculação", THE Sistema SHALL exibir uma confirmação com aviso de que a ação é irreversível
2. WHEN o usuário confirma a desvinculação, THE Sistema SHALL revogar o token de acesso do YouTube
3. THE Sistema SHALL remover a associação entre o Canal_YouTube e o Usuário do banco de dados
4. THE Sistema SHALL registrar a ação de desvinculação no Histórico_Auditoria
5. WHEN a desvinculação é concluída, THE Sistema SHALL enviar um email de confirmação ao usuário

---

### Requisito 8: Proteger Contra Invasão de Conta do Google

**User Story:** Como o sistema, quero proteger contra cenários onde a conta do Google de um usuário foi invadida, para que eu possa evitar que invasores vinculem canais do YouTube.

#### Critérios de Aceitação

1. WHEN uma vinculação é solicitada, THE Sistema SHALL verificar se há Atividade_Suspeita na conta do Usuário
2. IF houver múltiplas tentativas de vinculação de canais diferentes em curto período, THEN THE Sistema SHALL bloquear temporariamente novas vinculações
3. WHEN uma vinculação é bloqueada por suspeita, THE Sistema SHALL enviar um alerta ao email de recuperação do usuário
4. THE Sistema SHALL exigir verificação adicional (código de dois fatores) antes de permitir nova tentativa de vinculação

---

### Requisito 9: Proteger Contra Invasão de Conta do Sistema

**User Story:** Como o sistema, quero proteger contra cenários onde a conta do usuário na plataforma foi invadida, para que eu possa evitar que invasores desvinculem canais do YouTube.

#### Critérios de Aceitação

1. WHEN uma desvinculação é solicitada, THE Sistema SHALL verificar se há Atividade_Suspeita na conta do Usuário
2. IF houver Atividade_Suspeita, THEN THE Sistema SHALL exigir confirmação via email antes de processar a desvinculação
3. WHEN uma desvinculação é bloqueada por suspeita, THE Sistema SHALL enviar um alerta ao email de recuperação do usuário
4. THE Sistema SHALL permitir que o usuário revogue a desvinculação dentro de 24 horas se ela foi iniciada por um invasor

---

### Requisito 10: Notificar Usuários Sobre Atividades

**User Story:** Como um usuário, quero ser notificado sobre todas as atividades relacionadas ao meu canal vinculado, para que eu possa detectar atividades não autorizadas.

#### Critérios de Aceitação

1. WHEN uma vinculação é criada com sucesso, THE Sistema SHALL enviar um email de confirmação ao usuário
2. WHEN uma desvinculação é solicitada, THE Sistema SHALL enviar um email de notificação ao usuário
3. WHEN uma Atividade_Suspeita é detectada, THE Sistema SHALL enviar um alerta por email ao usuário
4. WHEN uma tentativa de recuperação é iniciada, THE Sistema SHALL enviar um email de notificação ao usuário anterior
5. THE Sistema SHALL incluir em cada email: timestamp, IP, localização, dispositivo e instruções para revogar a ação se necessário
