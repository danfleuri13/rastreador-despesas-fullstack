from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Configuração do Banco
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///despesas.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Transacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(100), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    categoria = db.Column(db.String(50), nullable=False)
    data = db.Column(db.String(10), nullable=False)
    tipo = db.Column(db.String(10), nullable=False) # Novo campo: 'entrada' ou 'saida'

    def to_json(self):
        return {
            "id": self.id,
            "descricao": self.descricao,
            "valor": self.valor,
            "categoria": self.categoria,
            "data": self.data,
            "tipo": self.tipo
        }

with app.app_context():
    db.create_all()

@app.route('/transacoes', methods=['GET'])
def get_transacoes():
    transacoes = Transacao.query.all()
    return jsonify([t.to_json() for t in transacoes])

@app.route('/transacoes', methods=['POST'])
def add_transacao():
    dados = request.json
    nova_transacao = Transacao(
        descricao=dados['descricao'],
        valor=dados['valor'],
        categoria=dados['categoria'],
        data=dados['data'],
        tipo=dados['tipo']
    )
    db.session.add(nova_transacao)
    db.session.commit()
    return jsonify({"mensagem": "Transação criada!"}), 201

@app.route('/transacoes/<int:id>', methods=['DELETE'])
def delete_transacao(id):
    item = Transacao.query.get(id)
    if item:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"mensagem": "Deletado!"})
    return jsonify({"erro": "Não encontrado"}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')