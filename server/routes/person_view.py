# -*- coding: utf-8 -*-

from . import person
from ..models import Circuit
from ..tools.parser import json_parser

from flask.ext.login import current_user, login_required
from flask import jsonify, json

@person.route('/')
@login_required
def index():
    return 'get data from person/mine and person/favorite'

@person.route('/mine')
@login_required
def mine():
    l = Circuit.query.filter_by(owner=current_user).all()
    l = map(json_parser, l)
    return jsonify(mine=l)

@person.route('/favorite')
@login_required
def favorite():
    l = current_user.favorite_circuits
    l = map(json_parser, l)
    return jsonify(favorite=l)

