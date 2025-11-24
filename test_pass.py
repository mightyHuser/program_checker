import sys

def main():
    # Read from stdin
    data = sys.stdin.read().strip()
    # Simple logic: multiply by 2
    try:
        val = int(data)
        print(val * 2)
    except ValueError:
        print("Invalid input")

if __name__ == "__main__":
    main()
