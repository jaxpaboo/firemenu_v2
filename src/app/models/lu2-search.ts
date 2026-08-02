export type Lu2Mode = 'movies' | 'shows';

export interface Lu2Poster {
  w100?: string;
  w200?: string;
  w300?: string;
  w400?: string;
  w500?: string;
}

export interface Lu2MovieResult {
  id_movie: number;
  slug: string;
  title: string;
  description: string;
  year?: number;
  imdb_rating?: number;
  poster?: Lu2Poster;
}
