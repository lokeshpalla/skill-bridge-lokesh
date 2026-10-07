DROP POLICY "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Challenges viewable by everyone" ON public.seasonal_challenges;
CREATE POLICY "Challenges viewable by everyone" ON public.seasonal_challenges FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Forum posts viewable by everyone" ON public.forum_posts;
CREATE POLICY "Forum posts viewable by everyone" ON public.forum_posts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Votes viewable by everyone" ON public.forum_votes;
CREATE POLICY "Votes viewable by everyone" ON public.forum_votes FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY "User badges viewable by everyone" ON public.user_badges;
CREATE POLICY "User badges viewable by everyone" ON public.user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY "Comments viewable by everyone" ON public.forum_comments;
CREATE POLICY "Comments viewable by everyone" ON public.forum_comments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Reviews viewable by everyone" ON public.mentor_reviews;
CREATE POLICY "Reviews viewable by everyone" ON public.mentor_reviews FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Group projects viewable by everyone" ON public.group_projects;
CREATE POLICY "Group projects viewable by everyone" ON public.group_projects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Members viewable by everyone" ON public.group_project_members;
CREATE POLICY "Members viewable by everyone" ON public.group_project_members FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Internships are viewable by everyone" ON public.internships;
CREATE POLICY "Internships are viewable by everyone" ON public.internships FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Rooms viewable by authenticated users" ON public.collaboration_rooms;
CREATE POLICY "Rooms viewable by authenticated users" ON public.collaboration_rooms FOR SELECT TO authenticated USING (is_active IS TRUE OR created_by = auth.uid());

DROP POLICY "Badges are viewable by everyone" ON public.badges;
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Portfolio projects are viewable by everyone" ON public.portfolio_projects;
CREATE POLICY "Portfolio projects are viewable by everyone" ON public.portfolio_projects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Learning paths viewable by everyone" ON public.learning_paths;
CREATE POLICY "Learning paths viewable by everyone" ON public.learning_paths FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars'::text AND owner_id = (SELECT auth.uid()::text));