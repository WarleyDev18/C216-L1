import pytest

from app.utils import dividir, eh_par, saudacao


def test_eh_par_numero_par():
    assert eh_par(4) is True


def test_eh_par_numero_impar():
    assert eh_par(7) is False


@pytest.mark.parametrize(
    "numero, esperado",
    [
        (2, True),
        (3, False),
        (10, True),
        (11, False),
    ],
)
def test_eh_par_parametrizado(numero, esperado):
    assert eh_par(numero) is esperado


def test_dividir_resultado_correto():
    assert dividir(10, 2) == 5


def test_dividir_por_zero_gera_erro():
    with pytest.raises(ValueError):
        dividir(10, 0)


@pytest.fixture
def usuario():
    return {"nome": "Warley", "email": "warley@example.com"}


def test_saudacao_com_fixture(usuario):
    assert saudacao(usuario["nome"]) == "Ola, Warley!"
