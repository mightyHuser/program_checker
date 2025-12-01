# 足し算を行うプログラム
# 2つの数値を入力として受け取り、計算結果を出力します。

def main():
    print("1つ目の数値を入力してください:")
    try:
        num1 = int(input())
    except ValueError:
        print("エラー: 数値を入力してください")
        return

    print("2つ目の数値を入力してください:")
    try:
        num2 = int(input())
    except ValueError:
        print("エラー: 数値を入力してください")
        return

    result = 0
    if "+" == "+":
        result = num1 + num2
    elif "+" == "-":
        result = num1 - num2
    elif "+" == "*":
        result = num1 * num2

    print(f"計算結果: {result}")

if __name__ == "__main__":
    main()
