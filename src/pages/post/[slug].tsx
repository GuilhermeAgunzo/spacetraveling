import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

// import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

function getReadingTime(post: Post): number {
  let words = 0;

  for (let i = 0; i < post.data.content.length; i += 1) {
    words += RichText.asHtml(post.data.content[i].body).split(' ').length;
  }

  return Math.ceil(words / 200);
}

export default function Post({ post }: PostProps): JSX.Element {
  const { content } = post.data;

  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className={styles.loading}>
        <div className={styles.spin}> </div>
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <time>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <div className={styles.author}>
              <FiUser /> {post.data.author}
            </div>
            <div className={styles.readingTime}>
              <FiClock /> {getReadingTime(post)} min
            </div>
          </div>

          {content.map(contentData => {
            return (
              <div className={styles.postContent} key={contentData.heading}>
                <h2>{contentData.heading}</h2>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(contentData.body),
                  }}
                />
              </div>
            );
          })}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [],
      pageSize: 10,
    }
  );

  return {
    paths: posts.results.map(post => {
      return {
        params: {
          slug: post.uid,
        },
      };
    }),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = (await prismic.getByUID('posts', String(slug), {})) as Post;

  const post = {
    uid: 'como-utilizar-hooks',
    first_publication_date: response.first_publication_date,
    data: response.data,
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 Minutos
  };
};
