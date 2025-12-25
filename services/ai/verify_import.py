
try:
    from langchain_core.language_models import FakeListChatModel
    print("Import Successful")
except ImportError as e:
    print(f"Import Failed: {e}")
    try:
        from langchain_community.chat_models import FakeListChatModel
        print("Import Successful from community")
    except ImportError as e2:
        print(f"Import Failed from community: {e2}")
