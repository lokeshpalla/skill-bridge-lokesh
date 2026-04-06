CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL DEFAULT 'chat',
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rate limits" ON public.ai_rate_limits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(_user_id uuid, _endpoint text, _max_requests integer DEFAULT 30, _window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing RECORD;
BEGIN
  SELECT * INTO _existing FROM ai_rate_limits
  WHERE user_id = _user_id AND endpoint = _endpoint;

  IF NOT FOUND THEN
    INSERT INTO ai_rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (_user_id, _endpoint, 1, now());
    RETURN true;
  END IF;

  -- Reset window if expired
  IF _existing.window_start < now() - (_window_minutes || ' minutes')::interval THEN
    UPDATE ai_rate_limits SET request_count = 1, window_start = now()
    WHERE user_id = _user_id AND endpoint = _endpoint;
    RETURN true;
  END IF;

  -- Check if under limit
  IF _existing.request_count >= _max_requests THEN
    RETURN false;
  END IF;

  -- Increment
  UPDATE ai_rate_limits SET request_count = request_count + 1
  WHERE user_id = _user_id AND endpoint = _endpoint;
  RETURN true;
END;
$$;