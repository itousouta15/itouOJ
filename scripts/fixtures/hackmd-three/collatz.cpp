#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <queue>
#include <unordered_set>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long target; int depth, count;
    cin >> target >> depth >> count;
    unordered_set<long long> visited{target};
    queue<pair<long long,int>> pending;
    pending.push({target, 0});
    while (!pending.empty()) {
        auto [value, steps] = pending.front(); pending.pop();
        if (steps == depth) continue;
        long long odd = (value - 1) / 3;
        vector<long long> parents{value * 2};
        if ((value - 1) % 3 == 0 && odd > 0 && odd % 2 == 1) parents.push_back(odd);
        for (auto parent : parents) if (visited.insert(parent).second) pending.push({parent, steps + 1});
    }
    vector<long long> sorted(visited.begin(), visited.end());
    sort(sorted.begin(), sorted.end());
    long long total = 0;
    while (count--) {
        long long value; cin >> value;
        int lo = 0, hi = sorted.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (sorted[mid] < value) lo = mid + 1;
            else hi = mid;
        }
        long long nearest = (1LL << 62);
        if (lo < (int)sorted.size()) nearest = min(nearest, llabs(sorted[lo] - value));
        if (lo) nearest = min(nearest, llabs(sorted[lo-1] - value));
        total += nearest;
    }
    cout << total << '\n';
}
