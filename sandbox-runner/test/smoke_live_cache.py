"""Check the live loopback sandbox cache without changing submissions or services."""

import json
import sys
import urllib.request


url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8090/api/v2/execute"
code = '#include <iostream>\nint main(){int n;std::cin>>n;std::cout<<n*2<<"\\n";}\n'
handle = None
for number in (2, 3):
    body = json.dumps({
        "language": "c++", "version": "10.2.0",
        "files": [{"name": "main.cpp", "content": code}],
        "stdin": f"{number}\n", "run_timeout": 1500,
        "run_memory_limit": 256 * 1024 * 1024, "compile_timeout": 15000,
        "want_compiled_handle": True, "compiled_handle": handle,
    }).encode()
    request = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=40) as response:
        result = json.load(response)
    assert result["compile"]["code"] == result["run"]["code"] == 0, result
    assert result["run"]["stdout"].strip() == str(number * 2), result
    assert result["compiled_cache_hit"] == (handle is not None), result
    assert result["compiled_handle"] and "compiled_binary" not in result, result
    handle = result["compiled_handle"]

print("sandbox live cache: compile, reuse and output OK")
