-- Contas com cadastro profissional iniciado e sem papel → profissional
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT p.user_id, 'profissional'::public.app_role
FROM public.professionals p
WHERE p.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.user_id)
ON CONFLICT (user_id, role) DO NOTHING;

-- Demais contas sem papel → paciente
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'paciente'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT (user_id, role) DO NOTHING;