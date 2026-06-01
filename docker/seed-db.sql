
-- ============================================================================
-- INSERTAR TENANTS (Escuelas de Ejemplo)
-- ============================================================================
INSERT INTO public.tenants (
  name, 
  email_domain, 
  cct_code, 
  description, 
  subscription_status,
  subscription_start_date,
  subscription_end_date,
  max_users,
  max_books,
  features
) VALUES (
  'Escuela Primaria José María Morelos',
  'jmmorelos.edu.mx',
  'CCT123456789',
  'Institución educativa privada de primaria en CDMX',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year',
  150,
  5000,
  '{"offline_mode": true, "barcode_reader": true, "bulk_import": true, "api_access": true}'
), (
  'Colegio San José',
  'colsanjose.edu.mx',
  'CCT987654321',
  'Institución educativa con primaria y secundaria',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year',
  300,
  10000,
  '{"offline_mode": true, "barcode_reader": true, "bulk_import": true, "api_access": true}'
), (
  'Instituto Técnico Valle del Cauca',
  'itecnico.edu.co',
  'CTC456789012',
  'Institución técnica colombiana',
  'trial',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days',
  50,
  2000,
  '{"offline_mode": false, "barcode_reader": false, "bulk_import": true, "api_access": false}'
);

-- ============================================================================
-- INSERTAR USUARIOS (Super Admin, Librarians, Students)
-- ============================================================================
INSERT INTO public.users (
  tenant_id, 
  email, 
  email_verified,
  email_verified_at,
  first_name, 
  last_name, 
  school_id,
  role, 
  password_hash,
  is_active
) SELECT 
  tenants.id,
  'admin@jmmorelos.edu.mx',
  true,
  CURRENT_TIMESTAMP,
  'Carlos',
  'Administrador',
  'ADM001',
  'school_admin',
  crypt('password123', gen_salt('bf')),
  true
FROM public.tenants WHERE email_domain = 'jmmorelos.edu.mx'
UNION ALL
SELECT 
  tenants.id,
  'diane@jmmorelos.edu.mx',
  true,
  CURRENT_TIMESTAMP,
  'Diana',
  'Pérez',
  'LIB001',
  'librarian',
  crypt('diana2024', gen_salt('bf')),
  true
FROM public.tenants WHERE email_domain = 'jmmorelos.edu.mx'
UNION ALL
SELECT 
  tenants.id,
  'alexa@jmmorelos.edu.mx',
  true,
  CURRENT_TIMESTAMP,
  'Luis',
  'García',
  'STU001',
  'student',
  crypt('student123', gen_salt('bf')),
  true
FROM public.tenants WHERE email_domain = 'jmmorelos.edu.mx'
UNION ALL
SELECT 
  tenants.id,
  'admin@colsanjose.edu.mx',
  true,
  CURRENT_TIMESTAMP,
  'Juanito',
  'Administrator',
  'ADM002',
  'school_admin',
  crypt('admin2024', gen_salt('bf')),
  true
FROM public.tenants WHERE email_domain = 'colsanjose.edu.mx';

-- ============================================================================
-- INSERTAR LIBROS (Catálogo de Ejemplo)
-- ============================================================================
INSERT INTO public.books (
  tenant_id,
  isbn,
  title,
  author,
  publisher,
  publication_year,
  category,
  description,
  total_copies,
  available_copies
) SELECT 
  tenants.id,
  '9788408178705',
  'Don Quijote',
  'Miguel de Cervantes',
  'Editorial Planeta',
  1605,
  'Clásicos Literarios',
  'La obra maestra de la literatura española',
  5,
  5
FROM public.tenants WHERE email_domain = 'jmmorelos.edu.mx'
UNION ALL
SELECT 
  tenants.id,
  '9788408179122',
  'Cien Años de Soledad',
  'Gabriel García Márquez',
  'Editorial Sudamericana',
  1967,
  'Novelas Clásicas',
  'Una de las novelas más importantes del siglo XX',
  3,
  3
FROM public.tenants WHERE email_domain = 'jmmorelos.edu.mx'
UNION ALL
SELECT 
  tenants.id,
  '9788432126047',
  'El Principito',
  'Antoine de Saint-Exupéry',
  'Salamandra',
  1943,
  'Literatura Infantil',
  'Una fábula poética para todas las edades',
  10,
  8
FROM public.tenants WHERE email_domain = 'jmmorelos.edu.mx'
UNION ALL
SELECT 
  tenants.id,
  '9788408181934',
  'Yo Antes de Ti',
  'Jojo Moyes',
  'Planeta',
  2012,
  'Romance',
  'Una historia de amor emocionante y transformadora',
  4,
  2
FROM public.tenants WHERE email_domain = 'colsanjose.edu.mx';

-- ============================================================================
-- INSERTAR EJEMPLARES (Book Copies con Códigos de Barras)
-- ============================================================================
INSERT INTO public.book_copies (
  tenant_id,
  book_id,
  barcode,
  serial_number,
  condition,
  location,
  is_available
) SELECT 
  books.tenant_id,
  books.id,
  'BIB' || SUBSTRING(books.id::text, 1, 6) || '-001',
  'SN-' || ROW_NUMBER() OVER (PARTITION BY books.id ORDER BY books.id),
  'good',
  'Sección A - Estante 1',
  true
FROM public.books WHERE title = 'Don Quijote'
UNION ALL
SELECT 
  books.tenant_id,
  books.id,
  'BIB' || SUBSTRING(books.id::text, 1, 6) || '-001',
  'SN-001',
  'excellent',
  'Sección Infantil - Estante 2',
  true
FROM public.books WHERE title = 'El Principito' LIMIT 1;

-- ============================================================================
-- INSERTAR PRÉSTAMOS DE EJEMPLO
-- ============================================================================
INSERT INTO public.loans (
  tenant_id,
  user_id,
  book_copy_id,
  librarian_id,
  created_by_user_id,
  loan_date,
  due_date,
  status
) SELECT 
  users.tenant_id,
  users.id,
  (SELECT id FROM public.book_copies 
   WHERE tenant_id = users.tenant_id 
   AND is_available = true
   LIMIT 1),
  (SELECT id FROM public.users 
   WHERE tenant_id = users.tenant_id 
   AND role = 'librarian' 
   LIMIT 1),
  (SELECT id FROM public.users 
   WHERE tenant_id = users.tenant_id 
   AND role = 'librarian' 
   LIMIT 1),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '14 days',
  'active'
FROM public.users 
WHERE role = 'student' 
AND deleted_at IS NULL
LIMIT 1;

-- ============================================================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Datos de semilla cargados exitosamente';
  RAISE NOTICE 'Tenants: 3';
  RAISE NOTICE 'Usuarios: 4+';
  RAISE NOTICE 'Libros: 4';
  RAISE NOTICE 'Cambiar contraseñas en producción';
END
$$;

-- ============================================================================
-- FIN DEL SCRIPT DE DATOS DE EJEMPLO
-- ============================================================================
