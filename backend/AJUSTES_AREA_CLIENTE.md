# Ajustes realizados para a área do cliente

## Endpoints adicionados

Todos em `app/routes/cliente.py`:

- `GET /clientes/me` → retorna os dados do cliente logado
- `GET /clientes/me/dashboard` → resumo do dashboard do aluno
- `GET /clientes/me/acessos` → histórico completo de acessos
- `GET /clientes/me/frequencia` → total de acessos liberados + datas
- `GET /clientes/me/pagamentos` → lista de pagamentos do cliente logado
- `POST /clientes/me/logout` → logout do cliente autenticado

## Ajustes de autenticação

Arquivo `app/core/security.py`:

- `get_current_user()` agora protege apenas rotas de staff
- `get_current_cliente()` foi criado para proteger rotas da área do aluno
- token do cliente continua usando `role = "cliente"`

## Ajustes de model/schema

- `app/models/cliente.py` foi corrigido e organizado
- `app/schemas/cliente.py` recebeu modelos de resposta para `/me` e `/me/dashboard`
- `app/schemas/pagamento.py` foi mantido compatível com a listagem da área do cliente

## Observação importante

Se o seu banco **já estiver criado em produção**, confirme se a tabela `clientes` possui a coluna `refresh_token`.
Se não tiver, será necessário criar a coluna por migração SQL antes de subir a nova versão.
