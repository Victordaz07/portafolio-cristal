-- Traduce al español el contenido de Reseñas y Testimonios que quedó en inglés
UPDATE "Review" SET category = 'Belleza' WHERE category = 'Beauty';
UPDATE "Review" SET category = 'Cuidado de la piel' WHERE category = 'Skincare';
UPDATE "Review" SET category = 'Estilo de vida' WHERE category = 'Lifestyle';

UPDATE "Review" SET title = 'IUNIK – Sérum de Árbol de Té' WHERE title = 'IUNIK – Tea Tree Serum';
UPDATE "Review" SET title = 'Mary & May – Mascarilla de Enjuague' WHERE title = 'Mary & May – Wash Off Mask';

UPDATE "Testimonial" SET role = 'Gerente de Marca – Dr. Different' WHERE role = 'Brand Manager – Dr. Different';
