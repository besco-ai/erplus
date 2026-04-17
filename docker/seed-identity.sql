-- ERPlus Identity Seed Script
-- Run this after migrations if seed data wasn't applied
-- Passwords: admin123 / user123 (BCrypt hashed)

INSERT INTO identity.users (
    "Id", "Name", "Email", "PasswordHash", "Role", "Initials",
    "IsActive", "IsDeleted", "CreatedAt"
) VALUES
(1, 'Giovanio Gonçalves', 'giovanio@egconsultorias.com.br',
 '$2a$11$K8xGz1YKlO5qMfVdQ3rYxeVJ7nYR6Z4G5fE8hD2bL0cN9wA1mX3Fy',
 'Operador Master', 'GG', true, false, '2026-01-01T00:00:00Z'),
(2, 'Carlos Silva', 'carlos@egconsultorias.com.br',
 '$2a$11$R3mN7pL2xK9vQ5wJ8sY1duF6hG4cB0eA3tI7nO9zX2lW5kD8jP6Uw',
 'Colaborador', 'CS', true, false, '2026-01-01T00:00:00Z')
ON CONFLICT ("Id") DO NOTHING;

-- Reset sequence
SELECT setval('identity.users_"Id"_seq', (SELECT MAX("Id") FROM identity.users));

-- Permissions seed
INSERT INTO identity.role_permissions (
    "RoleName", "Resource", "CanView", "CanEdit", "CanDelete", "IsDeleted", "CreatedAt"
)
SELECT role_name, resource,
    CASE WHEN role_name = 'Operador Master' THEN true
         WHEN role_name = 'Colaborador' AND resource IN ('dashboard','agenda','contatos','comercial','empreendimentos','producao','suporte') THEN true
         WHEN role_name = 'Visitante' AND resource IN ('dashboard','empreendimentos') THEN true
         ELSE false END,
    CASE WHEN role_name = 'Operador Master' THEN true
         WHEN role_name = 'Colaborador' AND resource IN ('dashboard','agenda','contatos','comercial','empreendimentos','producao','suporte') THEN true
         ELSE false END,
    CASE WHEN role_name = 'Operador Master' THEN true ELSE false END,
    false,
    '2026-01-01T00:00:00Z'
FROM (VALUES ('Operador Master'), ('Colaborador'), ('Visitante')) AS roles(role_name)
CROSS JOIN (VALUES
    ('dashboard'), ('agenda'), ('contatos'), ('financeiro'), ('comercial'),
    ('empreendimentos'), ('producao'), ('suporte'), ('configuracoes'), ('relatorios')
) AS resources(resource)
ON CONFLICT DO NOTHING;
