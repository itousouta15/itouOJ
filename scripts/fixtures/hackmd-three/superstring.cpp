#include <algorithm>
#include <functional>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<string> input(n), words;
    for (auto &s : input) cin >> s;
    for (int i = 0; i < n; ++i) {
        bool contained = false;
        for (int j = 0; j < n; ++j)
            if (i != j && input[j].find(input[i]) != string::npos) contained = true;
        if (!contained) words.push_back(input[i]);
    }
    int m = words.size();
    vector<vector<int>> overlap(m, vector<int>(m));
    for (int i = 0; i < m; ++i) for (int j = 0; j < m; ++j) if (i != j)
        for (int length = 1; length <= (int)min(words[i].size(), words[j].size()); ++length)
            if (words[i].substr(words[i].size() - length) == words[j].substr(0, length)) overlap[i][j] = length;
    string best;
    function<void(int,int,string)> search = [&](int used, int last, string value) {
        if (!best.empty() && value.size() > best.size()) return;
        if (used == (1 << m) - 1) {
            if (best.empty() || value.size() < best.size() || (value.size() == best.size() && value < best)) best = value;
            return;
        }
        for (int j = 0; j < m; ++j) if (!(used & (1 << j)))
            search(used | (1 << j), j, value + words[j].substr(last < 0 ? 0 : overlap[last][j]));
    };
    search(0, -1, "");
    cout << best << '\n';
}
