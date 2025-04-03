package main

import (
	"flag"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	codebasePath := flag.String("path", ".", "代码库路径")
	flag.Parse()

	codeSnippet := `
func RunCmdCheckErr(s string) {
	_, _, err := RunCmd(NewCmdOpt(Cmd(s)))
	if err != nil {
		panic(err)
	}
}
`
	identifiers, err := extractIdentifiersFromCodeSnippet(codeSnippet)
	if err != nil {
		fmt.Printf("提取标识符失败: %v\n", err)
		return
	}

	err = filepath.Walk(*codebasePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(path, ".go") {
			declarations, err := findDeclarationsInFile(path, identifiers)
			if err != nil {
				fmt.Printf("处理文件 %s 失败: %v\n", path, err)
				return nil
			}
			if len(declarations) > 0 {
				fmt.Printf("文件 %s 中找到以下声明：\n", path)
				for _, decl := range declarations {
					fmt.Println(decl)
				}
			}
		}
		return nil
	})

	if err != nil {
		fmt.Printf("遍历代码库失败: %v\n", err)
	}
}

func extractIdentifiersFromCodeSnippet(code string) ([]string, error) {
	virtualFile := "package main\n" + code
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "", virtualFile, parser.AllErrors)
	if err != nil {
		return nil, fmt.Errorf("解析代码片段失败: %v", err)
	}

	var identifiers []string

	ast.Inspect(file, func(n ast.Node) bool {
		callExpr, ok := n.(*ast.CallExpr)
		if !ok {
			return true
		}

		switch fun := callExpr.Fun.(type) {
		case *ast.Ident:
			identifiers = append(identifiers, fun.Name)
		case *ast.SelectorExpr:
			// 暂时处理包级函数，假设当前包
		default:
		}
		return true
	})

	return unique(identifiers), nil
}

func findDeclarationsInFile(path string, identifiers []string) ([]string, error) {
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, path, nil, parser.AllErrors)
	if err != nil {
		return nil, fmt.Errorf("解析文件失败: %v", err)
	}

	var results []string

	content, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("读取文件失败: %v", err)
	}

	ast.Inspect(file, func(n ast.Node) bool {
		switch node := n.(type) {
		case *ast.FuncDecl:
			if contains(identifiers, node.Name.Name) {
				code, err := getCodeSnippet(content, fset.Position(node.Pos()).Offset, fset.Position(node.End()).Offset)
				if err != nil {
					return true
				}
				pos := fset.Position(node.Pos())
				results = append(results, fmt.Sprintf("函数定义: %s\n位置: %s:%d\n代码:\n%s\n", node.Name.Name, pos.Filename, pos.Line, code))
			}
		case *ast.TypeSpec:
			if contains(identifiers, node.Name.Name) {
				code, err := getCodeSnippet(content, fset.Position(node.Pos()).Offset, fset.Position(node.End()).Offset)
				if err != nil {
					return true
				}
				pos := fset.Position(node.Pos())
				results = append(results, fmt.Sprintf("类型定义: %s\n位置: %s:%d\n代码:\n%s\n", node.Name.Name, pos.Filename, pos.Line, code))
			}
		}
		return true
	})

	return results, nil
}

func getCodeSnippet(content []byte, start, end int) (string, error) {
	if start < 0 || end > len(content) || start > end {
		return "", fmt.Errorf("无效的偏移量: start=%d, end=%d", start, end)
	}
	return string(content[start:end]), nil
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func unique(slice []string) []string {
	seen := make(map[string]bool)
	result := []string{}
	for _, s := range slice {
		if !seen[s] {
			seen[s] = true
			result = append(result, s)
		}
	}
	return result
}
