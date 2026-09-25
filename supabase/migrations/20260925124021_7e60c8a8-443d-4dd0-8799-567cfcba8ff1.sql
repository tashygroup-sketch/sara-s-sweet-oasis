CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'حلويات',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Menu is publicly viewable" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  delivery_date TEXT,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'جديد',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.menu_items (name, description, price, image_url, category, sort_order) VALUES
('كب كيك الورد', 'كب كيك بكريمة الزبدة الوردية ورشة لؤلؤ', 5.00, '/__l5e/assets-v1/eb4496f7-c24c-41de-a7ee-a6a29e42fb20/cupcake.jpg', 'كب كيك', 1),
('كيكة المناسبات', 'كيكة طابقين مزينة بالورد الطبيعي', 150.00, '/__l5e/assets-v1/67b6469b-72e1-4c08-94db-ca4b66c52b4c/cake.jpg', 'كيك', 2),
('ماكارون فرنسي', 'علبة 12 حبة ماكارون بنكهات متنوعة', 45.00, '/__l5e/assets-v1/2cb7737f-a40d-4c27-8793-affb0a39c8f8/macaron.jpg', 'ماكارون', 3),
('تشكيلة حلويات عربية', 'بقلاوة ومعمول وكنافة في صينية أنيقة', 80.00, '/__l5e/assets-v1/273345d1-ad3e-4f6f-9388-9f9b8411ebc5/arabic.jpg', 'حلويات عربية', 4);