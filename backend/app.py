from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app) # Permite que o React (porta diferente) fale com o Flask

# Configuração do Banco de Dados SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///despesas.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Modelo da Tabela (Como os dados são salvos)
class Despesa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(100), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    categoria = db.Column(db.String(50), nullable=False)
    data = db.Column(db.String(10), nullable=False) # Vamos salvar como String YYYY-MM-DD

    def to_json(self):
        return {
            "id": self.id,
            "descricao": self.descricao,
            "valor": self.valor,
            "categoria": self.categoria,
            "data": self.data # Retorna a data pro front
        }

# Cria o banco de dados se não existir
with app.app_context():
    db.create_all()

# Rota 1: Listar todas as despesas (GET)
@app.route('/despesas', methods=['GET'])
def get_despesas():
    despesas = Despesa.query.all()
    return jsonify([d.to_json() for d in despesas])

# Rota 2: Criar nova despesa (POST)
@app.route('/despesas', methods=['POST'])
def add_despesa():
    dados = request.json
    nova_despesa = Despesa(
        descricao=dados['descricao'],
        valor=dados['valor'],
        categoria=dados['categoria'],
        data=dados['data'] # Recebe a data do React
    )
    db.session.add(nova_despesa)
    db.session.commit()
    return jsonify({"mensagem": "Despesa criada!"}), 201

# Rota 3: Deletar despesa (DELETE)
@app.route('/despesas/<int:id>', methods=['DELETE'])
def delete_despesa(id):
    despesa = Despesa.query.get(id)
    if despesa:
        db.session.delete(despesa)
        db.session.commit()
        return jsonify({"mensagem": "Deletado!"})
    return jsonify({"erro": "Não encontrado"}), 404

if __name__ == '__main__':
    app.run(debug=True)