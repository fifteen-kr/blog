---
# eleventyExcludeFromCollections: ["posts"]
title: "파이썬 PS 팁 #1: 개요 및 입출력"
date: 2025-07-18
tags: [ps, python]
---

## 개요

저는 개발할 때 주로 자바스크립트를 사용합니다만, 취미로 프로그래밍 문제를 풀 때에는 자바스크립트가 아닌 파이썬을 정말 많이 즐겨씁니다.
파이썬이 프로그래밍 문제를 풀 때 여러모로 이점이 많기 때문이죠.

우선, 파이썬의 문법은 간결합니다. 예를 들어, [BOJ 8073번](https://www.acmicpc.net/problem/8073)을 C++로 푼다면 이렇게 됩니다.

```cpp
#include <iostream>
#include <vector>

using namespace std;

int main() {
    size_t N;
    cin >> N;
    
    vector<vector<int>> A{N, vector<int>(N)};
    for(auto& row : A) for(auto& v : row) cin >> v;

    auto isNeighbouring = [&](int i, int j) {
        for(int k=0; k<N; ++k) {
            if(k==i||k==j) continue;
            if(A[i][k] + A[k][j] == A[i][j]) return false;
        }

        return true;
    };
    
    for(int i=0; i<N-1; ++i) {
        for(int j=i+1; j<N; ++j) {
            if(isNeighbouring(i, j))
                cout << i+1 << ' ' << j+1 << '\n';
        }
    }
    
    return 0;
}
```

(C++에서 `using namespace std;`는 별로 권장되지 않는 습관임을 주의해 주세요.)

같은 로직[^1]을 파이썬으로 적으면 다음과 같습니다.

```py
N, *A = open(0)
N = int(N)
A = [list(map(int, row.split())) for row in A]

is_neighbouring = lambda i, j: \
    not any(A[i][k] + A[k][j] == A[i][j] for k in range(N) if k not in (i, j))

for i in range(N-1):
    for j in range(i+1, N):
        is_neighbouring(i, j) and print(i+1, j+1)
```

(함수 `is_neighbouring`에서 문제의 지문을 최대한 그대로 옮기기 위해 `all` 대신 일부러 `not any`를 썼습니다.)

파이썬 쪽이 자연어스러워서 조금 더 읽기 편하고 간결하죠. 개인적으로 파이썬의 제너레이터 문법이 정말 마음에 듭니다.[^2]

파이썬의 또 다른 강점은 "배터리 포함" 철학입니다. 제가 제일 좋아하는 언어는 앞서 언급한 자바스크립트입니다만, 불행하게도 자바스크립트에는 "표준 라이브러리"로서 제공되는 것 중, 프로그래밍 문제 풀이에 유용한 것은 거의 없습니다.
반면에, 파이썬 표준 라이브러리에는 프로그래밍 문제를 풀 때 유용한 것이 매우 많습니다.[^3]

하지만 이런 이점에도 불구하고, 입문 수준을 상회하는 프로그래밍 문제를 풀 때에는 파이썬은 C++보다 인기가 덜합니다. 이유는 뻔합니다. 느리거든요.

C++이나 Rust로 코드를 짜면, 컴파일러가 최적화를 해 주고, 보통은 코드나 구조체에 "불필요한 정보"가 생기지 않기 때문에, 문제에서 의도하는 시간 복잡도로 코드를 작성하기만 하면 웬만해서는 시간 제한을 넘지 않게 됩니다.

반면 파이썬에서는 여러 종류의 오버헤드(PyPy3으로 JIT 컴파일하더라도, 동적 타입이나 언어 스펙에 따른 오버헤드를 피할 수 없음)로 인해 백준 온라인 저지와 같이 시간 보정을 걸어주지 않으면 시간 제한을 넘기기 일쑤입니다.
특히, CPython을 이용하는 경우 시간 보정이 걸리더라도 최적화에 신경 쓰지 않으면 풀리지 않는 문제들이 많죠. 

그래도 파이썬은 특유의 매력이 있습니다. 대체적으로, **읽기 편한 파이썬 코드는 짧을 뿐만 아니라 성능도 더 좋은 경향**이 있습니다.
즉, 파이썬 표준 라이브러리에 있는 함수들을 잘 이용해 사용하고 싶은 알고리즘을 최대한 자연스럽게 코드에 녹아내면, 그게 곧 파이썬 최적화가 됩니다.[^4]

이 시리즈에서는 제가 파이썬으로 프로그래밍 문제를 풀 때, 자주 사용하는 코딩 기법(?)에 대해 다루어 보려 합니다.
이 글에서는 첫 번째로 파이썬에서 입출력을 하는 방법에 대해 알아보면서, 입출력 뿐만 아니라 메인 로직을 짜는 데에도 유용한 파이썬의 문법을 알아 봅시다.

## 입력

입력이 상대적으로 작으면 (한 10000바이트 이내?), `input`으로도 충분히 입력을 받을 수 있습니다.

[BOJ 1000번](https://www.acmicpc.net/problem/1000)을 "기본적인 문법"만으로 풀면 이렇게 풀 수 있겠네요.

```py
arr = input().split()
print(int(arr[0]) + int(arr[1]))
```

Iterable unpacking은 유용하게 쓰일 수 있지만, 초보자들은 잘 모를 수 있는 문법입니다.
입력을 받을 때 이를 활용하면 코드를 훨씬 간결하게 만들 수 있습니다.


```py
A, B = input().split()
print(int(A) + int(B))
```

한 줄에 있는 여러 정수를 입력 받을 때에는, `map(int, input().split())`을 쓰면 됩니다.
이 경우에는 입력받는 수의 개수가 두 개이므로 사실 필요한 건 아니지만, 입력받는 수의 개수가 많거나 미지수일 때 유용하죠.

```py
A, B = map(int, input().split())
print(A + B)
```

입력이 상대적으로 크면 `sys.stdin.readline`을 써야 한다는 사실은 [잘 알려져 있죠](https://www.acmicpc.net/problem/15552).

```py
import sys; input = sys.stdin.readline

for _ in range(int(input())):
    A, B = map(int, input().split())
    print(A + B)
```

한 가지 주의해야 할 점은 `sys.stdin.readline`의 반환값은 항상 개행 문자 `\n`이 맨 뒤에 있다는 것입니다.
보통은 그냥 무시해도 되지만, 문자열 입력을 받는 경우에는 `.rstrip()`으로 제거할 수 있습니다.

한편, 입력 패턴이 간단한 경우에는 앞서 나온 BOJ 8073번을 해결하는 코드와 비슷하게 아래과 같이 적을 수도 있습니다.

```py
N, *Ls = open(0)

for L in Ls:
    A, B = map(int, L.split())
    print(A + B)
```

구체적으로 첫 번째 줄은 다음과 같이 실행됩니다.

1. 빌트인 함수 `open`을 통해, file descriptor가 `0`인 파일(=`stdin`)의 파일 오브젝트(`io.TextIOBase`)가 만들어집니다.
2. 타겟에서 iterable unpacking을 하고 있으므로, 1의 파일 오브젝트가 이터레이터로 변환됩니다.
    - `io.IOBase`의 이터레이터는 스트림의 각 줄을 yield합니다.
3. 따라서 `N`에는 입력의 첫째 줄이, `Ls`에는 나머지 줄이 들어가게 됩니다.

### 정수 목록 입력받기

`input`, 또는 `sys.stdin.readline`을 이용해 간단하게[^5] 정수 목록을 입력받는 코드입니다.

```py
# 첫 번째 줄에 목록의 길이가, 다음 줄에 정수 N개가 주어지는 경우.
N = int(input())
A = list(map(int, input().split()))

# 첫 번째 줄에 목록의 길이가, 다음 N개의 줄 각각에 정수가 주어지는 경우.
A = [int(input()) for _ in range(N := int(input()))]

# 한 줄에 목록의 길이 N과 정수 N개가 주어지는 경우.
N, *A = map(int, input().split())
```

참고로 `_`, 혹은 `_`로 시작하는 변수명은, 파이썬에서 (`match`문을 제외하고) 특별한 의미는 없지만, 언어를 가리지 않고 많은 사람들이 "쓰지 않고 버리는 값"을 나타내는데 사용됩니다.

위 코드들에서 `N == len(A)`이기도 하고, 파이썬스러운 코드를 짜면 `N`을 직접 쓰지 않는 경우가 많아서, 사실 `N`을 별도로 읽을 필요는 낮지만, 나중에 쓸모가 있을지도 모르니 웬만해서는 읽어두는 것이 좋습니다.

한편, `A`가 규칙 없이 여러 줄에 나뉘어진 경우에는... 코드가 C++에 비해 더 복잡해 질 것 같네요....

`A`가 주어지는 마지막 줄이, `A`만으로 이루어져 있다면 아래와 같이 적을 수 있습니다.

```py
N, *A = map(int, input().split())
while len(A) < N: A.extend(map(int, input().split()))
```

`list.extend`, `dict.update`, `set.update`와 같이, 컬렉션에 iterable의 원소를 추가하는 함수들 또한 코드를 간결하게 만드는 데 요긴하게 사용할 수 있습니다.

### 정수 행렬 입력받기

```py
N, M = map(int, input().split())
A = [list(map(int, input().split())) for _ in range(N)]
```

### 그래프 입력받기

첫 줄에 그래프의 노드와 간선 수, 두 번째 줄부터 그래프의 간선이 1-based 인덱스로 주어지고, 이를 인접 리스트로 저장하는 코드입니다.

```py
N, E = map(int, input().split())
G = [[] for _ in range(N)]

for _ in range(E):
    u, v = map(int, input().split())
    u -= 1; v -= 1
    G[u].append(v); G[v].append(v)

```

저는 문제 지문이 1-based 인덱스를 사용하는 경우에도, 코드 내부적으로는 0-based 인덱스를 사용합니다. 이러는 편이 더 일관성이 있어서 덜 헷갈리기 때문입니다.
다만 이 경우, 입력할 때 `-1`, 출력할 때 `+1`을 해 주는 것을 잊지 말아야 합니다.

문제를 풀 때 문제가 생기지 않는다면, 그냥 그래프의 노드 개수를 `N+1`개로 잡고 풀어도 무방합니다.
다만 이 경우에는 오히려 문제 지문을 읽을 때 1-based와 0-based 인덱스의 혼동이 생길 수 있으니 주의해야 합니다.

한편, `u`와 `v`를 입력 받을 때 다음과 같이 받을 수도 있지만...

```py
u, v = map(lambda v: int(v)-1, input().split())
```

... 코드가 조금 짧아질 수는 있어도 가독성이 떨어져서 별로 권장하지는 않는 방법입니다.

## `solve` 함수

프로그래밍 문제를 풀 때에는 테스트 케이스 하나를 **독립적으로** 처리하는 `solve` 함수를 만들어 두는 것이 좋습니다.
당연하지만, `solve`라는 이름을 쓰는 특별한 이유가 있는 것은 아니고, 다른 이름을 사용해도 무방합니다.

조금 거추장스러울 수는 있지만, 이렇게 하는 게 좋은 데에는 크게 세 가지 이유가 있습니다.

- 작성한 코드를 테스트할 때, `solve` 함수가 있으면 훨씬 더 편하게 테스트할 수 있습니다.
- 글로벌 변수에 접근하는 것보다 로컬 변수에 접근하는 것이 조금 더 빠릅니다.[^6]
- 가끔 적용되는 경우이긴 한데, `solve` 함수를 이용해 입출력 코드가 간단해질 수 있습니다.

잠깐 코드 테스트에 대해 이야기 하겠습니다. 예를 들어, [BOJ 2042번](https://www.acmicpc.net/problem/2042)을 다음과 같이 풀었다고 해 봅시다.
전형적인 세그트리 입문 문제입니다.

```py
import sys; input = sys.stdin.readline

N, M, K = map(int, input().split())
A = [int(input()) for _ in range(N)]

T = [0]*N + A
for i in range(N-1, 0, -1): T[i] = T[2*i] + T[2*i+1]

for _ in range(M+K):
    a, b, c = map(int, input().split())
    b -= 1
    if a == 1:
        b += N
        d = c - T[b]
        while b: T[b] += d; b //= 2
    else:
        s = 0
        b += N; c += N
        while b < c:
            if b&1: s += T[b]; b += 1
            if c&1: s += T[c-1]
            b //= 2; c //= 2
        print(s)
```

이 코드는 정답입니다만, 만약 [모든 예제 입력에 대한 출력이 올바름에도 불구하고 오답 처리되었다면](https://www.acmicpc.net/board/view/152584) (일명 "맞왜틀"), 눈 앞이 캄캄해질 수 밖에 없습니다.

하지만 만약 아래와 같이 `solve` 함수를 만들었다면, ...

```py
import sys; input = sys.stdin.readline

# `solve` 함수, 전역변수 `N`을 사용하지 않는 것 참고.
def solve(A, Q):
    N = len(A)
    T = [0]*N + A
    for i in range(N-1, 0, -1): T[i] = T[2*i] + T[2*i+1]

    for (a, b, c) in Q:
        b -= 1
        if a == 1:
            b += N
            d = c - T[b]
            while b: T[b] += d; b //= 2
        else:
            s = 0
            b += N; c += N
            while b < c:
                if b&1: s += T[b]; b += 1
                if c&1: s += T[c-1]
                b //= 2; c //= 2
            yield s

# 입출력
N, M, K = map(int, input().split())

A = [int(input()) for _ in range(N)]
Q = [tuple(map(int, input().split())) for _ in range(M+K)]

for v in solve(A, Q): print(v)
```

... 다음과 같이, 시간 복잡도를 희생하는 대신 간단하고 검증이 쉬운 코드를 작성하고...

```py
def solve_naive(A, Q):
    A = A.copy()
    for (a, b, c) in Q:
        b -= 1
        if a == 1: A[b] = c
        else: yield sum(A[b:c])
```

... 랜덤 테스트 케이스를 생성하는 함수를 만들어서...

```py
from random import randint, shuffle
def make_input():
    N = randint(1, 10)
    M = randint(1, 10)
    K = randint(1, 10)
    vl, vh = -10, 10
    A = [randint(vl, vh) for _ in range(N)]
    QM = [(1, randint(1, N), randint(vl, vh)) for _ in range(M)]
    QK = [(2, (b := randint(1, N)), randint(b, N)) for _ in range(K)]
    Q = QM + QK; shuffle(Q)

    return A, Q
```

... 검증 코드를 쉽게 짤 수 있게 됩니다.

```py
while True:
    A, Q = make_input()
    
    ans_naive = list(solve_naive(A, Q))
    ans = list(solve(A, Q))

    assert(len(ans_naive) == len(ans))
    if all(x == y for (x, y) in zip(ans_naive, ans)): continue

    print("INCORRECT OUTPUT:")
    print(A, Q)
    print(ans_naive)
    print(ans)
    break 
```

다행히도(?) 위의 `solve`는 올바른 코드이기 때문에 어떤 것도 출력되지 않지만, 잘못된 `solve`를 짰을 때에는 매우 유용하게 쓰일 수 있습니다.

이렇게 랜덤 입력 테스트를 쉽게 할 수 있으려면, 특별한 이유가 없는 한 처음부터 **전역 변수를 함수 내에서 참조하지 않게** 코드를 짜는 것이 매우 중요합니다.

마찬가지로, `solve` 함수 안에서 **`print`를 하지 말고**, `return`이나 `yield`로 값을 반환하게 하는 것이 좋습니다.

### `solve`로 값 넘기기

일반적인 경우에는 별 것 없지만, 종종 다음과 같이 테스트 케이스가 구성되어 있는 경우가 있습니다.

- 첫째 줄에는 테스트 케이스의 개수 `N`이 주어짐.
- 투 번째 줄부터 `N`개 줄에는 각각의 테스트 케이스에 대한 입력이 한 줄에 하나씩 주어짐.

이 경우에는 다음과 같이 `*`를 사용하여 간편하게 `solve` 함수에 값을 넘겨줄 수 있습니다.

```py
for _ in range(int(input())):
    print(solve(*map(int, input().split())))
```

### `solve`에서 값 받기

특별한 팁은 없습니다. 굳이 따지자면, 다음 두 가지 팁이 있겠네요.

- `return`으로 여러 개의 값을 반환할 수 있다는 점을 기억하세요.
- `solve` 안에서 `yield`를 써서 값의 목록을 반환할 수도 있습니다.
  - 다만, `solve` 안에서 리스트를 만들어 반환하는 게 거추장스럽지 않다면, 그렇게 해 주세요.

```py
def solve():
    yield 12
    yield 34

ans = list(solve())

# 또는

for x in solve(): pass
```

## 출력

입력값을 받을 때 그냥 `input`을 사용하면 시간이 오래 걸릴 때가 많지만, 사실 `print`는 `sys.stdout.writeline` 대신 그냥 써도 대부분의 경우 큰 상관은 없습니다.

또한, `print`의 `flush` 인자의 기본값은 `False`이기 때문에, 출력 버퍼를 비우는 오버헤드를 걱정할 필요도 없습니다.
오히려 인터랙티브 문제를 풀 때, `print(..., flush=True)`를 해 주어야 하는 점을 명심해야 합니다.

한편, 값의 목록을 출력할 때에는 두 가지 소소한 팁이 있습니다.

- `print(*arr)`처럼 `*`를 사용하면, `arr`의 모든 원소를 공백으로 구분하여 출력할 수 있습니다.
  - `" ".join`을 쓰는 경우 `arr`의 모든 원소가 문자열이어야 하므로, `" ".join(map(str, arr))`등과 같이 거추장스러워 지는 것보다 편합니다.
  - `print`의 `sep` 인자를 적절히 사용해서, 구분자를 다른 문자로 바꿀 수도 있습니다.
- 정수를 여러 줄에 걸쳐 출력하는 문제 중 상당수의 채점기는, 실제로 개행 문자가 제 때 들어갔는지 확인하지 않습니다. 즉, 한 줄에 모든 정수를 `print(*arr)`와 같은 방식으로 출력해도 정답처리 될 때가 많습니다.

[^1]: 사실 C++를 약간 봐 줬습니다. FastIO도 안 쓰고, 몇몇 컴파일러 경고도 무시했습니다.
[^2]: C++의 ranges와 비교하면 더욱 그렇습니다.
[^3]: 이 점에서 파이썬의 단 한 가지 아쉬운 점이라면 C++의 `std::set`처럼 "정렬 집합"이 존재하지 않는다는 것입니다.
[^4]: 불행하게도, 이건 어느 정도 수준을 넘어서는 최적화를 할 때에는 아닐 수도 있습니다. 파이썬, 특히 CPython에서의 최적화는 골치 아픈 점들이 많이 있는데, 이 점에 대해서는 이 글이 아닌, 나중 글에서 다룰 생각입니다.
[^5]: 이 글의 코드는 대부분의 문제를 충분히 빠르게 풀 수 있는 "간결함"에 중점을 두며, "제일 빠른" 코드에 대해 다루지는 않습니다.
[^6]: 글로벌 변수에 접근할 때에는 `LOAD_NAME`, 로컬 변수에 접근할 때에는 `LOAD_FAST`를 사용하기 때문인데... 자세한 건 이 글에서 다루지 않겠습니다. 큰 차이는 아닙니다.
