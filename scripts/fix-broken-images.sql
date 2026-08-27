-- Strip out broken/missing image references from custom products
-- The images column is jsonb but currently stores a JSON string (text inside jsonb),
-- so we cast to jsonb (parsing the string), then iterate its array elements.
UPDATE products
SET images = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements_text((images #>> '{}')::jsonb) AS elem
  WHERE elem NOT IN ('/Granduncle.png', '/Grandmother.png')
)
WHERE product_type = 'custom'
RETURNING slug, jsonb_typeof(images) AS type, images;
