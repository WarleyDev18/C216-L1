def eh_par(numero: int) -> bool:
    return numero % 2 == 0


def dividir(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("divisao por zero")
    return a / b


def saudacao(nome: str) -> str:
    return f"Ola, {nome}!"
