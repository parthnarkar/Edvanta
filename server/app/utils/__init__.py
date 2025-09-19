"""Utility package for Edvanta.

Contains helper modules for external service integrations (placeholders).
"""

def optional_lib_available(lib_name: str) -> bool:
	"""Check if an optional library is importable in this runtime."""
	try:
		import importlib
		return importlib.util.find_spec(lib_name) is not None
	except Exception:
		return False
