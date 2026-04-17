import traceback, py_compile, sys
try:
    py_compile.compile('backend/app.py', doraise=True)
    print('OK')
except Exception:
    traceback.print_exc()
    sys.exit(1)
