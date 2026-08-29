from app.knowledge.retriever import retrieve


def test_retrieves_relevant_notice_type():
    res = retrieve("143(3)")
    assert res[0]["notice_type"] == "143_3"
    assert res[0]["is_verdict"] is False
    assert "source_note" in res[0]


def test_returns_source_metadata():
    res = retrieve("scrutiny selection")
    assert all("source_note" in r for r in res)
