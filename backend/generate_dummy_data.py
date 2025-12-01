import os
import random

def generate_dummy_data():
    # Create dummy_workspace directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.join(base_dir, "dummy_workspace")
    
    if not os.path.exists(workspace_dir):
        os.makedirs(workspace_dir)
        print(f"Created directory: {workspace_dir}")
    else:
        print(f"Directory already exists: {workspace_dir}")

    # Operations for random generation
    operations = [
        ("+", "足し算"),
        ("-", "引き算"),
        ("*", "掛け算"),
    ]

    # Generate 10 Python files
    for i in range(1, 11):
        filename = f"program_{i:02d}.py"
        filepath = os.path.join(workspace_dir, filename)
        
        op_symbol, op_name = random.choice(operations)
        
        code = f'''# {op_name}を行うプログラム
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
    if "{op_symbol}" == "+":
        result = num1 + num2
    elif "{op_symbol}" == "-":
        result = num1 - num2
    elif "{op_symbol}" == "*":
        result = num1 * num2

    print(f"計算結果: {{result}}")

if __name__ == "__main__":
    main()
'''
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)
        print(f"Generated: {filename}")

    # Generate 3 Text files
    text_contents = [
        "これはダミーのテキストファイルです。\nShift-JISでの表示確認用かもしれません。",
        "仕様書\n\n1. 入力: 整数2つ\n2. 出力: 計算結果\n\n以上",
        "メモ\n\nプログラムの動作確認には、\n正の整数だけでなく負の数も試してください。"
    ]

    for i, content in enumerate(text_contents):
        filename = f"note_{i+1:02d}.txt"
        filepath = os.path.join(workspace_dir, filename)
        
        # Randomly choose encoding to test robustness (mostly Shift-JIS for Windows simulation)
        encoding = "cp932" if i % 2 == 0 else "utf-8"
        
        with open(filepath, "w", encoding=encoding) as f:
            f.write(content)
        print(f"Generated: {filename} ({encoding})")

if __name__ == "__main__":
    generate_dummy_data()
