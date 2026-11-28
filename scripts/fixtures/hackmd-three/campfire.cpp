#include <iostream>
#include <numeric>
#include <set>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n, k; cin >> n >> k;
    vector<int> team(n), left(n), right(n);
    for (int &x : team) cin >> x;
    set<int> borders;
    for (int i = 0; i < n; ++i) {
        left[i] = (i + n - 1) % n;
        right[i] = (i + 1) % n;
        if (team[i] != team[left[i]]) borders.insert(i);
    }
    int active = 0, removed = 0;
    while (!borders.empty()) {
        auto next = borders.upper_bound(active);
        if (next == borders.end()) next = borders.begin();
        int victim = *next, a = left[victim], b = right[victim];
        borders.erase(next);
        right[a] = b; left[b] = a;
        if (team[a] == team[b]) borders.erase(b);
        else borders.insert(b);
        active = right[active];
        ++removed;
    }
    cout << removed << ' ' << team[active] << '\n';
}
