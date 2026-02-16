-- Tornar data opcional em receitas e solicitacoes_exames
alter table receitas alter column data drop not null;
alter table solicitacoes_exames alter column data drop not null;
