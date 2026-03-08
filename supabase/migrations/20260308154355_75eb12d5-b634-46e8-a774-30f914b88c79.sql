
-- Platform subscriptions table for tracking student fees
CREATE TABLE public.platform_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_name text NOT NULL DEFAULT 'monthly',
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  expires_at timestamp with time zone,
  payment_method text DEFAULT 'offline',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- Students can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.platform_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
  ON public.platform_subscriptions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Students can create their own subscription requests
CREATE POLICY "Users can request subscriptions"
  ON public.platform_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
