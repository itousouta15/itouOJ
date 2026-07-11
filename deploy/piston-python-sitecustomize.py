import sys

# 擋掉的 audit event -> 給使用者看的訊息
_BLOCKED = {
    "os.system": "os.system",
    "subprocess.Popen": "subprocess",  # 連 os.popen() 也會經過這個
    "os.exec": "os.exec*",
    "os.posix_spawn": "os.posix_spawn",
    "os.fork": "os.fork",
    "os.forkpty": "os.forkpty",
    "ctypes.dlopen": "ctypes",
    "ctypes.dlsym": "ctypes",
    "socket.__new__": "socket",
}


def _guard(event, args):
    label = _BLOCKED.get(event)
    if label is not None:
        raise PermissionError(f"這個評測環境不允許使用 {label}")


sys.addaudithook(_guard)
