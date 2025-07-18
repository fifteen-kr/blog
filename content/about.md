---js
const eleventyNavigation = {
    key: "About",
    order: 3,
};
---

# About

수상할 정도로 자바스크립트와 파이썬을 좋아하는 개발자의 블로그입니다.

## 타 사이트 계정

| Service | Link |
|:-------:|:----:|
| GitHub | <https://github.com/123jimin> |
| BOJ | <https://www.acmicpc.net/user/jiminp> |

## 블로그 기술 스택

이 블로그의 기술 스택에 대한 [글](http://blog.0xF.kr/post/2025/07-15-blog/)을 적었습니다.

블로그의 전체 소스 코드는 <https://github.com/fifteen-kr/blog> 에서 확인할 수 있습니다.

- 인스턴스는 Google Cloud에 있습니다.
- Static site generator로 [11ty](https://www.11ty.dev/)를 이용합니다.
  - 템플릿 언어로는 [Nunjucks](https://mozilla.github.io/nunjucks/)를 사용합니다.
- 11ty에 사용중인 플러그인은 다음과 같습니다.
  - [@11ty/eleventy-img](https://www.11ty.dev/docs/plugins/image/)
  - [@11ty/eleventy-navigation](https://www.11ty.dev/docs/plugins/navigation/)
  - [@11ty/eleventy-plugin-syntaxhighlight](https://www.11ty.dev/docs/plugins/syntaxhighlight/)
- `markdown-it`에 사용 중인 플러그인은 다음과 같습니다.
  - [@vscode/markdown-it-katex](https://www.npmjs.com/package/@vscode/markdown-it-katex)
  - [markdown-it-footnote](https://www.npmjs.com/package/markdown-it-footnote)
  - [@mdit/plugin-alert](https://www.npmjs.com/package/@mdit/plugin-alert)
- CSS는 [PostCSS](https://postcss.org/)와 [cssnano](https://cssnano.github.io/cssnano/)를 이용해 처리합니다.
- 댓글 기능은 [utterances](https://utteranc.es)를 이용합니다.
- 블로그 뿐만이 아니라, 제 사이트의 대부분의 컨텐츠는 Debian 서버에서 nginx를 통해 서빙됩니다.
  - 중간에 Cloudflare를 두고 있습니다.
- CI에는 GitHub Actions를, CD에는 [lanĉanto](https://github.com/fifteen-kr/lanchanto)를 이용합니다.
